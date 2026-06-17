import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Send,
  Calendar,
  FileCheck,
  BarChart3,
  Wallet,
  Database,
  Star,
} from 'lucide-react';
import { cn } from '@/utils';

const navItems = [
  { path: '/', label: '数据概览', icon: LayoutDashboard },
  { path: '/campaigns', label: '活动管理', icon: Megaphone },
  { path: '/kol', label: 'KOL搜索', icon: Users },
  { path: '/invitations', label: '邀约管理', icon: Send },
  { path: '/schedule', label: '排期管理', icon: Calendar },
  { path: '/content', label: '内容审核', icon: FileCheck },
  { path: '/reports', label: '数据报告', icon: BarChart3 },
  { path: '/finance', label: '费用结算', icon: Wallet },
  { path: '/archive', label: '数据沉淀', icon: Database },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-primary-800">KOL Star</h1>
            <p className="text-xs text-gray-500">网红合作管理平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink key={item.path} to={item.path}>
                {({ isActive: linkActive }) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'sidebar-item group relative',
                      (isActive || linkActive) && 'active'
                    )}
                  >
                    {(isActive || linkActive) && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"
                      />
                    )}
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors',
                        (isActive || linkActive)
                          ? 'text-primary-600'
                          : 'text-gray-400 group-hover:text-primary-600'
                      )}
                    />
                    <span className="text-sm">{item.label}</span>
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800 mb-2">需要帮助？</p>
          <p className="text-xs text-gray-600 mb-3">查看使用指南或联系技术支持</p>
          <button className="w-full btn-secondary text-sm py-2">
            查看帮助中心
          </button>
        </div>
      </div>
    </aside>
  );
}
