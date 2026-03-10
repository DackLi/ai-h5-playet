import axios from 'axios';
import { Playlet, Episode, ApiResponse } from '@/types';
import { API_BASE_URL, isDev, GAMEBRIDGE_API_URL } from './env';
import { getMockPlaylets } from './mock-data';

// 创建 axios 实例，baseURL 根据环境自动切换
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：可在此添加 token、日志等
api.interceptors.request.use(
  (config) => {
    if (isDev) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isDev) {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

// ============ API 默认参数 ============
// 这些参数来自真实 API 地址中的查询参数
const DEFAULT_PARAMS = {
  group_id: 'album_62',
  app_id: '45365886',
  device_id: 'f6fc6f33514a33b6',
  gaid: '2fa0f62d-f3b1-4045-9db2-f6e2f0ef5196',
  api_version: 1,
};

// ============ 数据缓存 + 请求去重 ============
// 缓存已获取的短剧列表，避免重复请求
let cachedPlaylets: Playlet[] | null = null;
let cachedLan: string | null = null;
// 正在进行中的请求 Promise（用于并发去重，避免 SSR 时多个组件同时请求导致 stream aborted）
let pendingRequest: Promise<Playlet[]> | null = null;
let pendingLan: string | null = null;

/**
 * 获取短剧列表（核心接口）
 * API: GET /drama/jowo/v1/page
 * 
 * 请求失败或无数据时自动回退到 mock 数据，方便调试
 * 
 * @param lan - 语言代码（en/ja/es）
 * @param pageIndex - 页码（从 1 开始）
 * @param pageSize - 每页数量
 * @returns 短剧列表和总数
 */
export async function fetchPlayletPage(
  lan: string = 'en',
  pageIndex: number = 1,
  pageSize: number = 50,
): Promise<{ list: Playlet[]; total: number }> {
  try {
    const response = await api.get<ApiResponse<Playlet[]>>('/drama/jowo/v1/page', {
      params: {
        ...DEFAULT_PARAMS,
        lan: lan.toLowerCase(),
        page_index: pageIndex,
        page_size: pageSize,
      },
    });

    const { data: playlets, success, total } = response.data;
    
    if (success && Array.isArray(playlets)) {
      // 过滤掉没有视频资源的短剧
      const validPlaylets = playlets.filter(p => p.resource_status === 'owned_video' && p.episodes.length > 0);
      
      // 对每个短剧的剧集按 episode_index 排序
      validPlaylets.forEach(p => {
        p.episodes.sort((a, b) => a.episode_index - b.episode_index);
      });

      // 如果真实 API 返回了有效数据，直接使用
      if (validPlaylets.length > 0) {
        console.log(`[API] 真实接口返回 ${playlets.length} 条数据，有效 ${validPlaylets.length} 条`);
        return { list: validPlaylets, total };
      }
      console.warn(`[API] 真实接口返回 ${playlets.length} 条数据，但无有效数据（均无视频资源或剧集为空）`);
    }

    // 真实 API 无有效数据，回退到 mock 数据
    console.warn('[API] 真实接口无有效数据，使用 mock 数据');
    return fallbackToMock();
  } catch (error) {
    // 请求失败，回退到 mock 数据
    console.error('[API] 获取短剧列表失败，使用 mock 数据:', error);
    return fallbackToMock();
  }
}

/**
 * 回退到 mock 数据
 */
function fallbackToMock(): { list: Playlet[]; total: number } {
  const mockData = getMockPlaylets();
  return { list: mockData, total: mockData.length };
}

/**
 * 获取所有短剧（带缓存 + 请求去重）
 * 
 * 解决 SSR 并发问题：
 * Next.js 服务端渲染时，首页的 fetchRecommended、fetchHotPlaylets、fetchLatestPlaylets
 * 会并行调用此函数。如果不做去重，会同时发出多个相同的 API 请求，
 * 导致 Node.js 的 HTTP 连接被中断（stream has been aborted），从而回退到 mock 数据。
 * 
 * 去重策略：如果已有同语言的请求正在进行中，直接复用该 Promise，不重复发请求。
 */
export async function fetchAllPlaylets(lan: string = 'en'): Promise<Playlet[]> {
  const normalizedLan = lan.toLowerCase();

  // 如果缓存有效（同语言），直接返回
  if (cachedPlaylets && cachedLan === normalizedLan) {
    return cachedPlaylets;
  }

  // 如果已有同语言的请求正在进行中，复用该 Promise（并发去重）
  if (pendingRequest && pendingLan === normalizedLan) {
    return pendingRequest;
  }

  // 发起新请求，并保存 Promise 引用
  pendingLan = normalizedLan;
  pendingRequest = fetchPlayletPage(lan, 1, 50)
    .then(({ list }) => {
      cachedPlaylets = list;
      cachedLan = normalizedLan;
      return list;
    })
    .finally(() => {
      // 请求完成后清除 pending 状态
      if (pendingLan === normalizedLan) {
        pendingRequest = null;
        pendingLan = null;
      }
    });

  return pendingRequest;
}

/**
 * 清除缓存（语言切换时调用）
 */
export function clearPlayletCache(): void {
  cachedPlaylets = null;
  cachedLan = null;
  pendingRequest = null;
  pendingLan = null;
}

// ============ 业务层 API（供页面组件调用） ============

/**
 * 获取推荐短剧（highlight === 1 的短剧）
 */
export async function fetchRecommended(lan: string = 'en'): Promise<Playlet[]> {
  const allPlaylets = await fetchAllPlaylets(lan);
  return allPlaylets.filter(p => p.highlight === 1);
}

/**
 * 获取热门短剧（按集数排序，集数多的优先）
 */
export async function fetchHotPlaylets(lan: string = 'en'): Promise<Playlet[]> {
  const allPlaylets = await fetchAllPlaylets(lan);
  return [...allPlaylets].sort((a, b) => b.episode_size - a.episode_size).slice(0, 6);
}

/**
 * 获取最新短剧（取列表后半部分，模拟最新上线）
 */
export async function fetchLatestPlaylets(lan: string = 'en'): Promise<Playlet[]> {
  const allPlaylets = await fetchAllPlaylets(lan);
  return allPlaylets.slice(-6).reverse();
}

/**
 * 获取短剧列表（支持分页）
 */
export async function fetchPlayletList(
  lan: string = 'en',
  page: number = 1,
  pageSize: number = 50,
): Promise<{ list: Playlet[]; total: number }> {
  const allPlaylets = await fetchAllPlaylets(lan);
  const start = (page - 1) * pageSize;
  return {
    list: allPlaylets.slice(start, start + pageSize),
    total: allPlaylets.length,
  };
}

/**
 * 获取短剧详情（通过 id 查找）
 */
export async function fetchPlayletDetail(lan: string = 'en', id: string): Promise<Playlet | null> {
  const allPlaylets = await fetchAllPlaylets(lan);
  return allPlaylets.find(p => p.id === id) || null;
}

/**
 * 获取剧集列表（从短剧对象中提取，已按 episode_index 排序）
 */
export async function fetchEpisodes(lan: string = 'en', playletId: string): Promise<Episode[]> {
  const playlet = await fetchPlayletDetail(lan, playletId);
  if (!playlet) return [];
  return playlet.episodes;
}

/**
 * 搜索短剧（按名称和简介模糊匹配）
 */
export async function searchPlaylets(lan: string = 'en', keyword: string): Promise<Playlet[]> {
  const allPlaylets = await fetchAllPlaylets(lan);
  const lowerKeyword = keyword.toLowerCase();
  return allPlaylets.filter(
    p =>
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.summary.toLowerCase().includes(lowerKeyword)
  );
}


// 获取政策页面相关内容
export const getPolicyAndContact = async (siteId: string, lang: string, type: string) => {
    try {
        const res = await axios.get(`${GAMEBRIDGE_API_URL}/site/${siteId}/custom_privacy_v2?language=${lang.toUpperCase()}&property_type=${type}`);
        let policyData = res.data.data.properties || {};
        return policyData;
    } catch (error) {
        console.error('Error fetching policy data:', error);
        return {};
    }
}

export default api;
