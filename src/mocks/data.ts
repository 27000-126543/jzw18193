import type {
  KOL,
  Campaign,
  Invitation,
  ContentReview,
  PerformanceData,
  Payment,
  CollaborationHistory,
  TrendDataPoint,
  DashboardStats,
  Contract,
  Invoice,
} from '../types';

const categories = [
  '美妆护肤', '时尚穿搭', '美食探店', '旅行生活', '科技数码',
  '健身运动', '母婴亲子', '家居家装', '游戏电竞', '教育知识',
  '汽车测评', '宠物生活',
];

const platforms = ['douyin', 'xiaohongshu', 'weibo', 'bilibili', 'kuaishou'] as const;

const kolNames = [
  '小美酱', '时尚达人Lily', '吃货小明', '旅行家老王', '科技怪咖',
  '健身教练Tony', '辣妈日记', '家居设计师Lisa', '游戏大神', '知识博主',
  '车评人老张', '铲屎官阿猫', '美妆师Amy', '穿搭博主Vivian', '美食家大伟',
  '旅行摄影师', '数码评测师', '瑜伽老师', '萌娃妈妈', '装修达人',
  '电竞主播', '考研名师', '二手车评估师', '宠物医生', '化妆师小雨',
  '街头潮人', '探店达人', '背包客小鹏', '极客数码君', '健身女孩',
  '育儿专家', '收纳整理师', '手游主播', '英语老师', '机车爱好者',
  '猫咪控', '护肤专家', '穿搭男神', '美食博主', '旅行攻略君',
];

function generateKOLs(): KOL[] {
  return kolNames.map((name, index) => {
    const platform = platforms[index % 5];
    const categoryCount = 1 + Math.floor(Math.random() * 2);
    const categoryIndices = new Set<number>();
    while (categoryIndices.size < categoryCount) {
      categoryIndices.add(Math.floor(Math.random() * categories.length));
    }
    const category = Array.from(categoryIndices).map((i) => categories[i]);
    const followers = Math.floor(Math.random() * 10000000) + 10000;
    const avgViews = Math.floor(followers * (0.05 + Math.random() * 0.3));
    const avgLikes = Math.floor(avgViews * (0.02 + Math.random() * 0.08));
    const engagementRate = avgLikes / avgViews;
    const price = Math.floor((followers / 10000) * (50 + Math.random() * 200));

    return {
      id: `kol-${index + 1}`,
      name,
      avatar: `https://i.pravatar.cc/150?img=${(index % 70) + 1}`,
      platform,
      category,
      followers,
      avgViews,
      avgLikes,
      engagementRate,
      price,
      score: 3 + Math.random() * 2,
      historyCount: Math.floor(Math.random() * 20),
      tags: ['高性价比', '优质内容', '涨粉快', '转化高', '配合度好'].slice(
        0,
        1 + Math.floor(Math.random() * 3)
      ),
      description: `${name}是${getPlatformName(platform)}平台${category.join('、')}领域的优质创作者，内容风格独特，粉丝粘性高。`,
      contact: `contact-${index + 1}@kolstar.com`,
    };
  });
}

function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博',
    bilibili: 'B站',
    kuaishou: '快手',
  };
  return names[platform] || platform;
}

const campaignNames = [
  '2024春季新品上市推广',
  '618年中大促活动',
  '双11狂欢节营销',
  '品牌周年庆活动',
  '新品体验官招募',
  '夏日防晒系列推广',
  '秋冬新品预热',
  '情人节特别企划',
  '母亲节感恩活动',
  '开学季学生优惠',
];

function generateCampaigns(): Campaign[] {
  const statuses = ['draft', 'active', 'completed', 'cancelled'] as const;
  return campaignNames.map((name, index) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30 + Math.floor(Math.random() * 60));

    return {
      id: `campaign-${index + 1}`,
      name,
      description: `${name}全平台KOL营销推广计划，覆盖美妆、时尚、生活方式等多个垂类，邀请头部及腰部KOL合作推广。`,
      budget: Math.floor(Math.random() * 2000000) + 100000,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: statuses[index % 4],
      kpi: {
        targetImpressions: Math.floor(Math.random() * 50000000) + 10000000,
        targetEngagements: Math.floor(Math.random() * 2000000) + 500000,
        targetClicks: Math.floor(Math.random() * 500000) + 100000,
      },
      createdAt: startDate.toISOString(),
      kolCount: 5 + Math.floor(Math.random() * 15),
    };
  });
}

function generateInvitations(kols: KOL[], campaigns: Campaign[]): Invitation[] {
  const invitations: Invitation[] = [];
  const statuses = ['pending', 'accepted', 'rejected', 'negotiating'] as const;

  for (let i = 0; i < 50; i++) {
    const kol = kols[i % kols.length];
    const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
    const publishDate = new Date(createdAt);
    publishDate.setDate(publishDate.getDate() + 15 + Math.floor(Math.random() * 15));

    let exception: Invitation['exception'] = null;
    if (i === 2 || i === 5) {
      const exceptionCreatedAt = new Date(createdAt);
      exceptionCreatedAt.setDate(exceptionCreatedAt.getDate() + 3);
      exception = {
        type: i === 2 ? 'communication_break' : 'data_anomaly',
        status: 'active',
        remark: i === 2 ? 'KOL 联系不上，电话微信均未回复' : '数据抓取异常，需要重新核实',
        createdAt: exceptionCreatedAt.toISOString(),
      };
    }

    invitations.push({
      id: `invitation-${i + 1}`,
      campaignId: campaign.id,
      kolId: kol.id,
      kolName: kol.name,
      campaignName: campaign.name,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      fee: kol.price,
      contentRequirements: `1. 产品开箱展示\n2. 核心卖点讲解\n3. 使用场景演示\n4. 购买链接引导`,
      timeline: '签约后3天内提交初稿，确认后7天内发布',
      createdAt: createdAt.toISOString(),
      publishDate: publishDate.toISOString().split('T')[0],
      exception,
    });
  }

  return invitations;
}

function generateReviews(invitations: Invitation[]): ContentReview[] {
  const reviews: ContentReview[] = [];
  const statuses = ['pending', 'approved', 'rejected'] as const;
  const acceptedInvitations = invitations.filter((i) => i.status === 'accepted');

  for (let i = 0; i < Math.min(30, acceptedInvitations.length); i++) {
    const invitation = acceptedInvitations[i];
    const submittedAt = new Date();
    submittedAt.setDate(submittedAt.getDate() - Math.floor(Math.random() * 15));

    reviews.push({
      id: `review-${i + 1}`,
      invitationId: invitation.id,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      version: 1 + Math.floor(Math.random() * 3),
      content: `【${invitation.campaignName}】\n\n今天给大家分享一款超级好用的产品！\n\n产品特点：\n✨ 质地轻盈，吸收快\n✨ 保湿效果持久\n✨ 香味清新自然\n\n使用方法：\n早晚洁面后，取适量均匀涂抹于面部，轻轻按摩至完全吸收。\n\n个人使用感受：\n用了一周，皮肤明显变得水润有光泽，强烈推荐给姐妹们！`,
      attachments: [
        `https://picsum.photos/seed/${i}-1/800/600`,
        `https://picsum.photos/seed/${i}-2/800/600`,
        `https://picsum.photos/seed/${i}-3/800/600`,
      ],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      feedback:
        i % 3 === 0
          ? '整体不错，但产品展示部分可以更详细一些，建议增加成分说明。'
          : i % 3 === 1
          ? '内容已通过审核，请按计划发布。'
          : '',
      submittedAt: submittedAt.toISOString(),
      reviewedAt:
        statuses[Math.floor(Math.random() * statuses.length)] !== 'pending'
          ? new Date(submittedAt.getTime() + 86400000 * (1 + Math.random() * 3)).toISOString()
          : undefined,
    });
  }

  return reviews;
}

function generatePerformanceData(
  invitations: Invitation[],
  campaigns: Campaign[]
): PerformanceData[] {
  const acceptedInvitations = invitations.filter((i) => i.status === 'accepted');
  return acceptedInvitations.map((invitation, index) => {
    const campaign = campaigns.find((c) => c.id === invitation.campaignId);
    const targetImpressions = campaign?.kpi.targetImpressions ?? Math.floor(Math.random() * 5000000) + 500000;
    const targetEngagements = campaign?.kpi.targetEngagements ?? Math.floor(targetImpressions * 0.05);
    const targetClicks = campaign?.kpi.targetClicks ?? Math.floor(targetEngagements * 0.15);

    const multiplier = 0.6 + Math.random() * 0.8;
    const impressions = Math.floor(targetImpressions * multiplier);
    const engagements = Math.floor(targetEngagements * multiplier);
    const clicks = Math.floor(targetClicks * multiplier);
    const conversionRate = 0.02 + Math.random() * 0.08;
    const roi = 1.5 + Math.random() * 4;
    const fetched = Math.random() > 0.3;

    return {
      id: `performance-${index + 1}`,
      contentId: invitation.id,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      impressions: fetched ? impressions : 0,
      engagements: fetched ? engagements : 0,
      clicks: fetched ? clicks : 0,
      conversionRate: fetched ? conversionRate : 0,
      roi: fetched ? roi : 0,
      collectedAt: new Date().toISOString(),
      targetImpressions,
      targetEngagements,
      targetClicks,
      fetchStatus: fetched ? 'success' : 'idle',
      lastFetchedAt: fetched ? new Date().toISOString() : undefined,
    };
  });
}

function generatePayments(invitations: Invitation[]): Payment[] {
  const payments: Payment[] = [];
  const acceptedInvitations = invitations.filter((i) => i.status === 'accepted');

  for (let i = 0; i < Math.min(40, acceptedInvitations.length); i++) {
    const invitation = acceptedInvitations[i];
    const depositDueDate = new Date(invitation.createdAt);
    depositDueDate.setDate(depositDueDate.getDate() + 3);
    const finalDueDate = new Date(invitation.publishDate || invitation.createdAt);
    finalDueDate.setDate(finalDueDate.getDate() + 15);

    const depositPaid = Math.random() > 0.2;
    const finalPaid = depositPaid && Math.random() > 0.5;

    payments.push({
      id: `payment-${i * 2 + 1}`,
      invitationId: invitation.id,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      type: 'deposit',
      amount: Math.floor(invitation.fee * 0.3),
      status: depositPaid ? 'paid' : 'pending',
      dueDate: depositDueDate.toISOString().split('T')[0],
      paidAt: depositPaid ? depositDueDate.toISOString() : undefined,
    });

    payments.push({
      id: `payment-${i * 2 + 2}`,
      invitationId: invitation.id,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      type: 'final',
      amount: Math.floor(invitation.fee * 0.7),
      status: finalPaid ? 'paid' : depositPaid ? 'pending' : 'overdue',
      dueDate: finalDueDate.toISOString().split('T')[0],
      paidAt: finalPaid ? finalDueDate.toISOString() : undefined,
    });
  }

  return payments;
}

function generateHistory(
  kols: KOL[],
  campaigns: Campaign[],
  performanceData: PerformanceData[]
): CollaborationHistory[] {
  const history: CollaborationHistory[] = [];

  for (let i = 0; i < Math.min(20, performanceData.length); i++) {
    const perf = performanceData[i];
    const kol = kols.find((k) => k.name === perf.kolName) || kols[0];
    const campaign = campaigns.find((c) => c.name === perf.campaignName) || campaigns[0];

    history.push({
      id: `history-${i + 1}`,
      kolId: kol.id,
      kolName: kol.name,
      campaignId: campaign.id,
      campaignName: campaign.name,
      finalImpressions: perf.impressions,
      finalEngagements: perf.engagements,
      finalClicks: perf.clicks,
      finalRoi: perf.roi,
      rating: 3 + Math.floor(Math.random() * 3),
      feedback:
        Math.random() > 0.3
          ? 'KOL配合度高，内容质量好，数据表现超出预期，下次继续合作！'
          : '整体表现不错，希望下次能更及时地提交内容。',
      completedAt: new Date(
        Date.now() - Math.floor(Math.random() * 180) * 86400000
      ).toISOString(),
    });
  }

  return history;
}

function generateTrendData(): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const baseImpressions = 2000000 + Math.random() * 3000000;
    const baseEngagements = baseImpressions * (0.03 + Math.random() * 0.05);
    const baseClicks = baseEngagements * (0.1 + Math.random() * 0.15);

    data.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(baseImpressions),
      engagements: Math.floor(baseEngagements),
      clicks: Math.floor(baseClicks),
    });
  }

  return data;
}

function generateDashboardStats(): DashboardStats {
  return {
    activeCampaigns: 8,
    pendingReviews: 12,
    monthlyBudget: 1500000,
    averageRoi: 3.2,
    totalImpressions: 125680000,
    totalEngagements: 8956000,
    totalClicks: 1256000,
  };
}

function generateContracts(invitations: Invitation[]): Contract[] {
  const contracts: Contract[] = [];
  const acceptedInvitations = invitations.filter((i) => i.status === 'accepted');

  for (let i = 0; i < acceptedInvitations.length; i++) {
    const invitation = acceptedInvitations[i];
    const isSigned = Math.random() > 0.3;
    const createdAt = new Date(invitation.createdAt);
    const signedAt = new Date(createdAt);
    signedAt.setDate(signedAt.getDate() + 2);

    contracts.push({
      id: `contract-${i + 1}`,
      invitationId: invitation.id,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      status: isSigned ? 'signed' : 'unsigned',
      fee: invitation.fee,
      signedAt: isSigned ? signedAt.toISOString() : undefined,
      createdAt: createdAt.toISOString(),
    });
  }

  return contracts;
}

function generateInvoices(payments: Payment[]): Invoice[] {
  const invoices: Invoice[] = [];
  const paidPayments = payments.filter((p) => p.status === 'paid');

  for (let i = 0; i < paidPayments.length; i++) {
    const payment = paidPayments[i];
    const isIssued = Math.random() > 0.2;
    const createdAt = new Date(payment.paidAt || new Date().toISOString());
    const issuedAt = new Date(createdAt);
    issuedAt.setDate(issuedAt.getDate() + 1);

    invoices.push({
      id: `invoice-${i + 1}`,
      paymentId: payment.id,
      invitationId: payment.invitationId,
      kolName: payment.kolName,
      campaignName: payment.campaignName,
      type: payment.type,
      amount: payment.amount,
      status: isIssued ? 'issued' : 'pending',
      issuedAt: isIssued ? issuedAt.toISOString() : undefined,
      createdAt: createdAt.toISOString(),
    });
  }

  return invoices;
}

export const mockKOLs = generateKOLs();
export const mockCampaigns = generateCampaigns();
export const mockInvitations = generateInvitations(mockKOLs, mockCampaigns);
export const mockReviews = generateReviews(mockInvitations);
export const mockPerformanceData = generatePerformanceData(mockInvitations, mockCampaigns);
export const mockPayments = generatePayments(mockInvitations);
export const mockContracts = generateContracts(mockInvitations);
export const mockInvoices = generateInvoices(mockPayments);
export const mockHistory = generateHistory(mockKOLs, mockCampaigns, mockPerformanceData);
export const mockTrendData = generateTrendData();
export const mockDashboardStats = generateDashboardStats();

export const categoriesList = categories;
export const platformsList = platforms;
