import { Bell, Search, Settings, ChevronDown, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useState } from 'react';

const pageTitles: Record<string, string> = {
  '/': '数据概览',
  '/campaigns': '活动管理',
  '/campaigns/create': '创建活动',
  '/kol': 'KOL搜索库',
  '/invitations': '邀约管理',
  '/schedule': '排期管理',
  '/content': '内容审核',
  '/reports': '数据报告',
  '/finance': '费用结算',
  '/archive': '数据沉淀',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingReviews, activeCampaigns } = useAppStore((state) => state.dashboardStats);
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    if (location.pathname.startsWith('/campaigns/') && location.pathname !== '/campaigns/create') {
      return '活动详情';
    }
    if (location.pathname.startsWith('/kol/')) {
      return 'KOL详情';
    }
    return pageTitles[location.pathname] || 'KOL Star';
  };

  const getActionButton = () => {
    if (location.pathname === '/campaigns') {
      return (
        <button
          onClick={() => navigate('/campaigns/create')}
          className="btn-accent"
        >
          <Plus className="w-4 h-4" />
          创建活动
        </button>
      );
    }
    return null;
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="font-display font-semibold text-xl text-gray-800">
            {getPageTitle()}
          </h2>
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索活动、KOL、邀约..."
              className="input pl-10 w-80 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {getActionButton()}

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {(pendingReviews > 0 || activeCampaigns > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-scale-in">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">通知中心</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingReviews > 0 && (
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-600 text-xs font-medium">
                            {pendingReviews}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            待审核内容
                          </p>
                          <p className="text-xs text-gray-500">
                            有 {pendingReviews} 条内容等待您的审核
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeCampaigns > 0 && (
                    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 text-xs font-medium">
                            {activeCampaigns}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            进行中活动
                          </p>
                          <p className="text-xs text-gray-500">
                            当前有 {activeCampaigns} 个活动正在进行
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-success-600 text-xs">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          新合作完成
                        </p>
                        <p className="text-xs text-gray-500">
                          小美酱的合作已完成并生成报告
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">市</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">市场部-李经理</p>
              <p className="text-xs text-gray-500">管理员</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
