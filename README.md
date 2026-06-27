# Weather Website

用于 Polymarket 天气市场辅助分析的前后端项目。UI 可以参考 `polywx.xyz` 的信息密度，但后端数据不依赖 polywx；polywx 只作为竞品/字段参考，不作为本项目数据源。

## 当前数据架构

官方/原始数据源优先：

- Forecast: Open-Meteo Forecast API
- Historical: Open-Meteo Historical Weather API / Archive API
- METAR: NOAA AviationWeather Data API
- Derived analytics: diff stats、accuracy、historical/METAR match、peak marker、prediction 由官方源返回的数据计算得到
- Market city metadata: 本地维护的 Polymarket 天气市场城市、机场代码、经纬度和时区

暂未配置的官方源：

- PWS: 暂无可靠的全球官方 PWS API，因此接口会明确返回 `provider=not-configured`，不会伪造数据
- China live weather: 暂无官方 provider，因此接口会明确返回 `provider=not-configured`

## 项目结构

```text
weather_website/
  backend/                  Fastify API
    src/data/               城市 metadata
    src/providers/          Open-Meteo / AviationWeather / HTTP provider
    src/routes/             API routes
    src/services/           weatherRepository 聚合层
  frontend/                 React + Vite 前端
    src/api/                API client
    src/components/         UI components
    src/hooks/              数据 hooks
    src/styles.css          样式
  docs/API.md               API 说明
  scripts/verify-real-data.mjs
```

## 安装

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 启动

后端：

```bash
cd backend
npm start
```

默认地址：`http://127.0.0.1:8080`

前端：

```bash
cd frontend
npm run dev
```

默认地址：`http://127.0.0.1:5173`

## 后端 API

- `GET /api/health`
- `GET /api/cities`
- `GET /api/status`
- `GET /api/recommendations`
- `GET /api/dates?city=busan-rkpk`
- `GET /api/forecast?city=busan-rkpk&date=2026-06-27`
- `GET /api/metar?city=busan-rkpk&date=2026-06-27`
- `GET /api/historical?city=busan-rkpk&date=2026-06-27`
- `GET /api/pws?city=busan-rkpk&date=2026-06-27`
- `GET /api/weather-cn-live?city=busan-rkpk&date=2026-06-27`
- `GET /api/diffstats/latest?city=busan-rkpk&date=2026-06-27`
- `GET /api/accuracy/latest?city=busan-rkpk&date=2026-06-27`
- `GET /api/historical-metar-match?city=busan-rkpk&date=2026-06-27`
- `GET /api/peak-marker?city=busan-rkpk&date=2026-06-27`
- `GET /api/prediction?city=busan-rkpk&date=2026-06-27`
- `GET /api/fetchlog?city=busan-rkpk&limit=20`

## Provider 约定

正常情况下不应出现 `provider=polywx`。

官方源或官方派生源包括：

- `open-meteo-forecast`
- `open-meteo-archive`
- `aviationweather.gov`
- `official-derived`
- `open-meteo-derived`
- `local-market-metadata`
- `derived-provider-window`
- `local-request-plan`

未配置但不伪造的接口会返回：

```json
{
  "meta": {
    "provider": "not-configured",
    "realData": false
  }
}
```

## 验证

后端语法：

```bash
node --check backend/src/services/weatherRepository.js backend/src/providers/http.js backend/src/providers/openMeteoProvider.js backend/src/providers/aviationWeatherProvider.js backend/src/routes/apiRoutes.js
```

前端构建：

```bash
cd frontend
npm run build
```

官方源检查：

```bash
node scripts/verify-real-data.mjs
```

该脚本会拒绝 `provider=polywx` 的响应。

最新本地验证：2026-06-27 使用临时后端 `http://127.0.0.1:18080/api` 检查 50 个城市、500 个 endpoint 响应，结果 `failed=0`、`polywxResponses=0`。

## 前端功能

- 动态城市列表
- 城市搜索
- 按洲、时区、字母分组
- 日期选择、前一天、后一天、今天
- 刷新当前城市数据
- 浅色/深色切换
- 侧栏收起/展开
- Tab 切换：预报、METAR、历史观测、偏差统计、抓取日志
- 预报表字段显隐
- Polymarket 天气市场辅助用的预测、峰值、偏差、准确度卡片

## 后续增强

1. 接入付费/官方 PWS provider。
2. 接入 NWS API 作为美国城市 forecast/observation 补充。
3. 为 Polymarket 市场合约增加价格、概率、盈亏和提醒逻辑。
4. 增加数据库缓存和抓取 worker，避免每次请求都实时打官方 API。


