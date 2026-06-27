import { CloudSun, Globe2, Moon, RefreshCw, Star, Sun, X } from 'lucide-react';

export default function Header({ apiOnline, loading, lastUpdated, isLightMode, isEnglish, onRefresh, onToggleTheme, onToggleLanguage, onClosePanel }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <CloudSun size={18} />
        </div>
        <div className="brand-title">天气监测</div>
        <span className="version">v0.88</span>
      </div>

      <div className="top-actions">
        <span className={`api-status ${apiOnline ? 'online' : 'offline'}`}>
          {loading ? '连接中' : apiOnline ? 'API 在线' : '等待真实数据'}
        </span>
        <span className="updated">已刷新 {lastUpdated}</span>
        <button className="icon-button" title="收起侧栏" type="button" onClick={onClosePanel}>
          <X size={18} />
        </button>
        <button className="action-button" type="button" title="会员功能即将接入" onClick={() => window.alert('会员功能会用于保存城市、提醒和个性化模型，目前先保留入口。')}>
          <Star size={16} />
          会员
        </button>
        <button className="action-button" type="button" title="切换语言标签" onClick={onToggleLanguage}>
          <Globe2 size={16} />
          {isEnglish ? '中文' : 'EN'}
        </button>
        <button className="action-button" type="button" title="切换浅色/深色" onClick={onToggleTheme}>
          {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
          {isLightMode ? '深色' : '浅色'}
        </button>
        <button className="action-button" type="button" title="重新抓取当前城市数据" onClick={onRefresh}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>
    </header>
  );
}
