import { NextResponse } from 'next/server';

/**
 * 健康检查接口
 * GET /health
 * 用于部署时的健康探测（如 Docker、Nginx、K8s 等）
 */
export async function GET() {
  return NextResponse.json({
    name: 'H5Playlet',
  });
}
