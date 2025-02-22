const Router = require("koa-router");
const bilibiliRouter = new Router();
const axios = require("axios");
const { get, set, del, startCaching } = require("../utils/cacheData");

// 接口信息
const routerInfo = {
  name: "bilibili",
  title: "哔哩哔哩",
  subtitle: "热门榜",
};

// 缓存键名
const cacheKey = "bilibiliData";

// 调用时间
let updateTime = new Date().toISOString();

// 调用路径
const url = "https://api.bilibili.com/x/web-interface/ranking/v2";

// 数据处理
const getData = (data) => {
  if (!data) return [];
  return data.map((v) => {
    return {
      id: v.bvid,
      title: v.title,
      desc: v.desc,
      pic: v.pic.replace(/http:/, "https:"),
      owner: v.owner,
      data: v.stat,
      hot: v.stat.view,
      url: v.short_link_v2 || `https://b23.tv/${v.bvid}`,
      mobileUrl: `https://m.bilibili.com/video/${v.bvid}`,
    };
  });
};

// 从服务器拉取更新数据
const fetchDataAndUpdate = async () => {
  const response = await axios.get(url);
  const data = getData(response.data.data.realtime);
  updateTime = await startCaching(cacheKey, data);
};

// 每五分钟执行一次缓存操作
const interval = 5 * 60 * 1000;

// 立即执行一次回调函数
fetchDataAndUpdate();

// 创建定时器
setInterval(fetchDataAndUpdate, interval);

// 哔哩哔哩热门榜
bilibiliRouter.get("/bilibili", async (ctx) => {
  console.log("获取哔哩哔哩热门榜");
  try {
    // 从缓存中获取数据
    let data = await get(cacheKey);
    const from = data ? "cache" : "server";
    if (!data) {
      // 如果缓存中不存在数据
      console.log("从服务端重新获取哔哩哔哩热门榜");
      // 从服务器拉取数据
      fetchDataAndUpdate();
      // 将数据写入缓存
      await set(cacheKey, data);
    }
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      from,
      total: data.length,
      updateTime,
      data,
    };
  } catch (error) {
    console.error(error);
    ctx.body = {
      code: 500,
      ...routerInfo,
      message: "获取失败",
    };
  }
});

// 哔哩哔哩热门榜 - 获取最新数据
bilibiliRouter.get("/bilibili/new", async (ctx) => {
  console.log("获取哔哩哔哩热门榜 - 最新数据");
  try {
    // 从服务器拉取最新数据
    const response = await axios.get(url);
    const newData = getData(response.data.data.list);
    updateTime = new Date().toISOString();
    console.log("从服务端重新获取哔哩哔哩热门榜");

    // 返回最新数据
    ctx.body = {
      code: 200,
      message: "获取成功",
      ...routerInfo,
      total: newData.length,
      updateTime,
      data: newData,
    };

    // 删除旧数据
    await del(cacheKey);
    // 将最新数据写入缓存
    await set(cacheKey, newData);
  } catch (error) {
    // 如果拉取最新数据失败，尝试从缓存中获取数据
    console.error(error);
    const cachedData = await get(cacheKey);
    if (cachedData) {
      ctx.body = {
        code: 200,
        message: "获取成功",
        ...routerInfo,
        total: cachedData.length,
        updateTime,
        data: cachedData,
      };
    } else {
      // 如果缓存中也没有数据，则返回错误信息
      ctx.body = {
        code: 500,
        ...routerInfo,
        message: "获取失败",
      };
    }
  }
});

bilibiliRouter.info = routerInfo;
module.exports = bilibiliRouter;
