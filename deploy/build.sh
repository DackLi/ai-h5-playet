#!/bin/bash
shopt -s extglob
COMPONENT=$1
curdir=$(cd "$(dirname "$0")"; pwd)

# 构建环境参数：优先读取环境变量 BUILD_ENV，其次读取脚本第二个参数，默认 prod
# 支持两种传参方式：
#   1. 环境变量：export BUILD_ENV=test && bash build.sh h5-playlet
#   2. 脚本参数：bash build.sh h5-playlet test
BUILD_ENV=${BUILD_ENV:-${2:-prod}}

function Log(){
    dateFormat=`date "+%Y-%m-%d %H:%M:%S"`
    level="INFO"
    messageShow="message is null"
    if [[ $1 != "" ]];then
        typeset -u level=$1
    fi
    if [[ $2 != "" ]];then
        messageShow=$2
    fi
    printf "[%s] %s %s\n" "$level" "$dateFormat" "$messageShow"
}

function isError(){
  if [ $? -ne 0 ];then
      Log ERROR "构建失败"
    exit 1
  fi
}

function build(){
    Log INFO "当前构建环境: ${BUILD_ENV}"

    Log INFO "[CMD] npm install"
    npm install
    isError

    # 根据环境参数选择不同的构建命令
    if [ "$BUILD_ENV" = "test" ]; then
        Log INFO "[CMD] npm run build:test（测试环境）"
        npm run build:test
    else
        Log INFO "[CMD] npm run build:prod（线上环境）"
        npm run build:prod
    fi
    isError
    Log INFO "构建完成"
}

function cleanSpace(){
    # 保留部署所需文件，清理其余文件
    rm -rf !(deploy|.next|public|package.json|node_modules)
}

build
cleanSpace
