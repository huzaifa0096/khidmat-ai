/**
 * Admin Dashboard — system overview, providers, financials, analytics.
 * Read-only aggregation over the in-memory backend store.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import {
  fetchAdminOverview,
  fetchAdminProviders,
  fetchAdminAnalytics,
  fetchAdminRevenue,
} from '../src/services/api';

type Tab = 'overview' | 'providers' | 'analytics' | 'revenue';

const TABS: { id: Tab; label_en: string; label_ur: string; icon: any }[] = [
  { id: 'overview', label_en: 'Overview', label_ur: 'Overview', icon: 'speedometer' },
  { id: 'providers', label_en: 'Providers', label_ur: 'Providers', icon: 'people' },
  { id: 'analytics', label_en: 'Analytics', label_ur: 'Analytics', icon: 'analytics' },
  { id: 'revenue', label_en: 'Revenue', label_ur: 'Revenue', icon: 'cash' },
];

export default function AdminScreen() {
  const { lang, colors, theme } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminOverview(),
      fetchAdminProviders({ sort: 'revenue', limit: 15 }),
      fetchAdminAnalytics(),
      fetchAdminRevenue(),
    ])
      .then(([o, p, a, r]) => {
        setOverview(o);
        setProviders(p);
        setAnalytics(a);
        setRevenue(r);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={lang === 'ur' ? 'Admin Dashboard' : 'Admin Dashboard'} subtitle="Platform Control Center" />

      {/* Tabs — iOS segmented control style */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: spacing.lg,
          marginBottom: spacing.md,
          backgroundColor: colors.bg.elevated,
          borderRadius: 9,
          padding: 2,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 7,
                borderRadius: 7,
                backgroundColor: active ? colors.bg.surfaceSolid : 'transparent',
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: active ? colors.text.primary : colors.text.tertiary,
                  fontSize: 12,
                  fontWeight: active ? '600' : '500',
                  letterSpacing: -0.1,
                }}
              >
                {lang === 'ur' ? t.label_ur : t.label_en}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.textAccent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom: spacing.xxxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'overview' && overview ? (
            <OverviewTab data={overview} lang={lang} colors={colors} />
          ) : null}
          {tab === 'providers' && providers ? (
            <ProvidersTab data={providers} lang={lang} colors={colors} theme={theme} />
          ) : null}
          {tab === 'analytics' && analytics ? (
            <AnalyticsTab data={analytics} lang={lang} colors={colors} />
          ) : null}
          {tab === 'revenue' && revenue ? (
            <RevenueTab data={revenue} lang={lang} colors={colors} />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// Tabs
// ============================================================================

const OverviewTab = ({ data, lang, colors }: any) => {
  const sys = data.system;
  const book = data.bookings;
  const agents = data.agents;
  const fin = data.financials;
  return (
    <>
      <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}>
        <GlassCard>
          <Section title={lang === 'ur' ? 'Platform' : 'Platform'} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Kpi label="Providers" value={sys.providers_total} sub={`${sys.providers_active} active`} />
            <Kpi label="Categories" value={sys.categories} sub="services" />
            <Kpi label="Cities" value={sys.cities} sub="coverage" />
            <Kpi label="Status" value={sys.uptime_status} sub="API" />
          </View>
        </GlassCard>
      </MotiView>

      <GlassCard>
        <Section title={`Bookings · ${book.total} total · ${book.today} today`} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(book.by_status || {}).map(([k, v]: any) => (
            <View
              key={k}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: colors.bg.elevated,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: statusColor(k, colors),
                }}
              />
              <Text style={{ color: colors.text.primary, fontSize: 12 }}>
                {k.replace(/_/g, ' ')} · {v}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard>
        <Section title={lang === 'ur' ? 'Agent Pipeline' : 'Agent Pipeline'} />
        <Text style={{ color: colors.text.secondary, fontSize: 13, lineHeight: 18 }}>
          {agents.agents_in_pipeline.length} specialist agents · {agents.traces_total} traces · avg{' '}
          {agents.avg_steps_per_trace} steps/trace
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {agents.agents_in_pipeline.map((a: string) => (
            <View
              key={a}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: colors.bg.elevated,
              }}
            >
              <Text style={{ color: colors.text.secondary, fontSize: 11, fontWeight: '500' }}>
                {a.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard>
        <Section title={lang === 'ur' ? 'Financials' : 'Financials'} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Kpi label="Gross" value={`PKR ${fmtK(fin.gross_revenue_pkr)}`} sub="all bookings" />
          <Kpi label="Commission" value={`PKR ${fmtK(fin.platform_commission_pkr)}`} sub={`${fin.commission_percent}% platform`} />
          <Kpi label="Payout" value={`PKR ${fmtK(fin.provider_earnings_pkr)}`} sub="to providers" />
        </View>
      </GlassCard>
    </>
  );
};

const Section = ({ title }: { title: string }) => {
  const { colors } = useApp();
  return (
    <Text
      style={{
        color: colors.text.tertiary,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.6,
        marginBottom: 10,
      }}
    >
      {title.toUpperCase()}
    </Text>
  );
};

const ProvidersTab = ({ data, lang, colors, theme }: any) => (
  <>
    <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '500', letterSpacing: 0.3, marginBottom: 4 }}>
      Showing top {data.providers.length} · sorted by {data.sort}
    </Text>
    {data.providers.map((p: any) => (
      <GlassCard key={p.id}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 }}>
              {p.business_name}
            </Text>
            <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
              {p.category?.replace(/_/g, ' ')} · {p.sector}, {p.city}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '500' }}>
              {p.rating}★
            </Text>
            <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
              {p.reviews_count} reviews
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <Mini label="Bookings" value={p.bookings} />
          <Mini label="Revenue" value={`PKR ${fmtK(p.revenue_pkr)}`} />
          <Mini label="Earnings" value={`PKR ${fmtK(p.earnings_pkr)}`} />
          <Mini label="Completion" value={`${p.completion_rate || '-'}%`} />
          {p.verified ? <Mini label="Status" value="Verified" /> : null}
        </View>
      </GlassCard>
    ))}
  </>
);

const AnalyticsTab = ({ data, lang, colors }: any) => (
  <>
    <GlassCard>
      <Section title={lang === 'ur' ? 'Demand by city' : 'Demand by city'} />
      {data.demand_by_city.map((c: any) => (
        <BarRow key={c.city} label={c.city} value={c.count} max={data.demand_by_city[0]?.count || 1} colors={colors} />
      ))}
    </GlassCard>

    <GlassCard>
      <Section title={lang === 'ur' ? 'Demand by service' : 'Demand by service'} />
      {data.demand_by_service.slice(0, 8).map((c: any) => (
        <BarRow key={c.category} label={c.category?.replace(/_/g, ' ')} value={c.count} max={data.demand_by_service[0]?.count || 1} colors={colors} />
      ))}
    </GlassCard>

    <GlassCard>
      <Section title={lang === 'ur' ? 'Top earners' : 'Top earners'} />
      {data.top_earners.map((e: any, i: number) => (
        <View
          key={e.provider_id}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 9,
            borderBottomWidth: i === data.top_earners.length - 1 ? 0 : 0.5,
            borderBottomColor: colors.border.divider,
          }}
        >
          <Text style={{ color: colors.text.primary, fontSize: 14 }}>
            {i + 1}. {e.business_name}
          </Text>
          <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600' }}>
            PKR {fmtK(e.earnings_pkr)}
          </Text>
        </View>
      ))}
    </GlassCard>

    {data.shortage_zones.length > 0 ? (
      <GlassCard>
        <Section title={lang === 'ur' ? 'Shortage zones' : 'Shortage zones'} />
        {data.shortage_zones.map((z: any) => (
          <View
            key={z.city}
            style={{
              paddingVertical: 9,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 14,
                  fontWeight: '500',
                  textTransform: 'capitalize',
                }}
              >
                {z.city}
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 1 }}>
                {z.demand} demand · {z.providers} providers
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: z.alert ? colors.semantic.danger : colors.semantic.success,
                }}
              />
              <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                {z.demand_per_provider.toFixed(2)}× ratio
              </Text>
            </View>
          </View>
        ))}
      </GlassCard>
    ) : null}
  </>
);

const RevenueTab = ({ data, lang, colors }: any) => (
  <>
    <GlassCard>
      <Section title={lang === 'ur' ? '7-day totals' : '7-day totals'} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Kpi label="Gross" value={`PKR ${fmtK(data.totals_7d.gross_pkr)}`} sub="all bookings" />
        <Kpi label="Commission" value={`PKR ${fmtK(data.totals_7d.commission_pkr)}`} sub="platform 5%" />
        <Kpi label="Payout" value={`PKR ${fmtK(data.totals_7d.provider_earnings_pkr)}`} sub="to providers" />
        <Kpi label="Bookings" value={data.totals_7d.bookings} sub="confirmed" />
      </View>
    </GlassCard>

    <GlassCard>
      <Section title={lang === 'ur' ? 'Daily revenue' : 'Daily revenue'} />
      {data.daily_series.length === 0 ? (
        <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>
          No confirmed bookings yet.
        </Text>
      ) : (
        data.daily_series.map((d: any, i: number) => (
          <View
            key={d.date}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 10,
              borderBottomWidth: i < data.daily_series.length - 1 ? 0.5 : 0,
              borderBottomColor: colors.border.divider,
            }}
          >
            <View>
              <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '500' }}>{d.date}</Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 1 }}>
                {d.bookings} bookings
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600' }}>
                PKR {fmtK(d.gross)}
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                +PKR {fmtK(d.commission)} commission
              </Text>
            </View>
          </View>
        ))
      )}
    </GlassCard>
  </>
);

// ============================================================================
// Small helpers
// ============================================================================

const fmtK = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : (n || 0).toString();

const Kpi = ({ label, value, sub }: any) => {
  const { colors } = useApp();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '40%',
        backgroundColor: colors.bg.elevated,
        borderRadius: radii.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '500', letterSpacing: 0.2 }}>
        {label}
      </Text>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 19,
          fontWeight: '700',
          letterSpacing: -0.5,
          marginTop: 4,
          textTransform: 'capitalize',
        }}
      >
        {value}
      </Text>
      <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 2 }}>{sub}</Text>
    </View>
  );
};

const Mini = ({ label, value }: { label: string; value: any; color?: string }) => {
  const { colors } = useApp();
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: colors.bg.elevated,
      }}
    >
      <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color: colors.text.primary, fontSize: 12, fontWeight: '600', marginTop: 1 }}>{value}</Text>
    </View>
  );
};

const BarRow = ({ label, value, max, colors }: any) => (
  <View style={{ paddingVertical: 7 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 13,
          fontWeight: '400',
          textTransform: 'capitalize',
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
      <Text style={{ color: colors.text.tertiary, fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
    <View
      style={{
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.bg.elevated,
        marginTop: 6,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: 3,
          width: `${Math.min(100, (value / max) * 100)}%`,
          backgroundColor: colors.text.tertiary,
          borderRadius: 1.5,
        }}
      />
    </View>
  </View>
);

const statusColor = (status: string, colors: any) => {
  if (status.includes('confirmed') || status.includes('completed')) return colors.semantic.success;
  if (status.includes('cancelled') || status.includes('declined')) return colors.semantic.danger;
  if (status.includes('pending')) return colors.ios.orange;
  return colors.text.secondary;
};
