import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatNumber, formatMoney, formatPercent, cn } from '@/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import {
  Search,
  Filter,
  Users,
  ChevronRight,
  Star,
  Eye,
  Heart,
  Send,
  X,
} from 'lucide-react';
import { categoriesList, platformsList } from '@/mocks/data';
import type { Platform, FilterOptions } from '@/types';
import { useShallow } from 'zustand/shallow';

export default function KOLSearch() {
  const navigate = useNavigate();
  const kolsAll = useAppStore(useShallow((state) => state.kols));
  const filters = useAppStore(useShallow((state) => state.filters));
  const setFilters = useAppStore((state) => state.setFilters);
  const getFilteredKOLs = useAppStore((state) => state.getFilteredKOLs);
  const kols = useMemo(() => getFilteredKOLs(), [getFilteredKOLs, kolsAll, filters]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);

  const filteredKOLs = useMemo(() => {
    let result = [...kols];

    if (selectedCategory.length > 0) {
      result = result.filter((k) =>
        k.category.some((c) => selectedCategory.includes(c))
      );
    }

    return result;
  }, [kols, selectedCategory]);

  const handlePlatformChange = (platform: Platform | undefined) => {
    setFilters({ platform });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategory((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setFilters({
      platform: undefined,
      followersMin: undefined,
      followersMax: undefined,
      priceMin: undefined,
      priceMax: undefined,
      search: '',
    });
    setSelectedCategory([]);
  };

  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setFilters({ search: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索KOL名称、垂类、标签..."
            value={searchInput}
            onChange={handleSearch}
            className="input pl-12"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn-secondary',
            showFilters && 'bg-primary-50 text-primary-700 border-primary-200'
          )}
        >
          <Filter className="w-4 h-4" />
          筛选器
          {(selectedCategory.length > 0 || filters.platform) && (
            <span className="w-5 h-5 bg-accent-500 text-white rounded-full text-xs flex items-center justify-center">
              {selectedCategory.length + (filters.platform ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 flex-shrink-0 space-y-6"
          >
            <Card className="p-5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">筛选条件</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  清除
                </button>
              </div>

              <div>
                <label className="input-label">平台</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePlatformChange(undefined)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      !filters.platform
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    全部
                  </button>
                  {platformsList.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => handlePlatformChange(platform)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filters.platform === platform
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {
                        {
                          douyin: '抖音',
                          xiaohongshu: '小红书',
                          weibo: '微博',
                          bilibili: 'B站',
                          kuaishou: '快手',
                        }[platform]
                      }
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">垂类</label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        selectedCategory.includes(category)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">粉丝量 (万)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="最小值"
                      className="input text-sm py-2"
                      value={filters.followersMin ? filters.followersMin / 10000 : ''}
                      onChange={(e) =>
                        setFilters({
                          followersMin: e.target.value
                            ? Number(e.target.value) * 10000
                            : undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="最大值"
                      className="input text-sm py-2"
                      value={filters.followersMax ? filters.followersMax / 10000 : ''}
                      onChange={(e) =>
                        setFilters({
                          followersMax: e.target.value
                            ? Number(e.target.value) * 10000
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">报价 (元)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="最低"
                      className="input text-sm py-2"
                      value={filters.priceMin || ''}
                      onChange={(e) =>
                        setFilters({
                          priceMin: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="最高"
                      className="input text-sm py-2"
                      value={filters.priceMax || ''}
                      onChange={(e) =>
                        setFilters({
                          priceMax: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-primary-50 to-accent-50">
              <h3 className="font-semibold text-primary-800 mb-3">智能推荐</h3>
              <p className="text-sm text-gray-600 mb-4">
                基于您的历史合作数据，为您推荐以下KOL
              </p>
              <button className="w-full btn-primary text-sm">
                查看推荐列表
              </button>
            </Card>
          </motion.div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              共找到 <span className="font-semibold text-gray-800">{filteredKOLs.length}</span> 位KOL
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600">
                综合排序
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">
                粉丝量
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">
                价格
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredKOLs.map((kol, index) => (
              <motion.div
                key={kol.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className="p-5 cursor-pointer"
                  onClick={() => navigate(`/kol/${kol.id}`)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={kol.avatar}
                      alt={kol.name}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {kol.name}
                        </h3>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-medium">
                            {kol.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <PlatformBadge platform={kol.platform} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {kol.category.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <p className="font-mono font-semibold text-gray-800 text-sm">
                        {formatNumber(kol.followers)}
                      </p>
                      <p className="text-xs text-gray-500">粉丝</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                      <p className="font-mono font-semibold text-gray-800 text-sm">
                        {formatNumber(kol.avgViews)}
                      </p>
                      <p className="text-xs text-gray-500">均播</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                        <Heart className="w-3.5 h-3.5" />
                      </div>
                      <p className="font-mono font-semibold text-gray-800 text-sm">
                        {formatPercent(kol.engagementRate)}
                      </p>
                      <p className="text-xs text-gray-500">互动率</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">合作报价</p>
                      <p className="font-display font-bold text-lg text-accent-600">
                        {formatMoney(kol.price)}
                      </p>
                    </div>
                    <button
                      className="btn-accent text-sm py-2 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/invitations');
                      }}
                    >
                      <Send className="w-4 h-4" />
                      发邀约
                    </button>
                  </div>

                  {kol.historyCount > 0 && (
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>历史合作 {kol.historyCount} 次</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredKOLs.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">暂无匹配的KOL</p>
              <button onClick={clearFilters} className="btn-secondary">
                清除筛选条件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
