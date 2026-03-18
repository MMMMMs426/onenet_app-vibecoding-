import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneNetService, SensorData, OneNetConfig } from '../services/onenet';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const HALF_CARD = (SCREEN_W - 16 * 2 - CARD_GAP) / 2;

const C = {
  bg1: '#0A0E27',
  bg2: '#151A3A',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.07)',
  white: '#FFFFFF',
  sub: 'rgba(255,255,255,0.5)',
  tempHot: '#FF6B6B',
  tempWarm: '#FFB74D',
  tempCool: '#4FC3F7',
  tempCold: '#90CAF9',
  drip: '#42A5F5',
  pump: '#29B6F6',
  fan: '#26C6DA',
  heater: '#FF7043',
  uv: '#CE93D8',
  on: '#66BB6A',
  off: '#464660',
};

function tempColor(t?: number | null) {
  if (t == null) return C.sub;
  if (t >= 60) return C.tempHot;
  if (t >= 35) return C.tempWarm;
  if (t >= 15) return C.tempCool;
  return C.tempCold;
}

/* ─── 设备状态卡片 ─── */
function DeviceCard({
  icon,
  label,
  active,
  color,
}: {
  icon: any;
  label: string;
  active: boolean;
  color: string;
}) {
  const bg1 = active ? color + '18' : 'rgba(50,50,70,0.35)';
  const bg2 = active ? color + '06' : 'rgba(50,50,70,0.12)';
  return (
    <View style={[s.devCard, active && { borderColor: color + '30' }]}>
      <LinearGradient colors={[bg1, bg2]} style={s.devCardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[s.devIconWrap, { backgroundColor: active ? color + '22' : 'rgba(255,255,255,0.04)' }]}>
          <MaterialCommunityIcons name={icon} size={26} color={active ? color : C.sub} />
        </View>
        <Text style={s.devLabel}>{label}</Text>
        <View style={s.devStatusRow}>
          <View style={[s.devDot, { backgroundColor: active ? C.on : C.off }]} />
          <Text style={[s.devStatus, { color: active ? C.on : C.sub }]}>
            {active ? '运行中' : '已关闭'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

/* ─── 主屏幕 ─── */
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SensorData | null>(null);
  const [ok, setOk] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastTime, setLastTime] = useState('--:--:--');
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('onenet_config');
      if (!raw) {
        setErr('请先在「设置」页面配置 OneNet 连接信息');
        setOk(false);
        setLoading(false);
        return;
      }
      const cfg: OneNetConfig = JSON.parse(raw);
      if (!cfg.productId || !cfg.deviceName || !cfg.accessKey) {
        setErr('OneNet 配置不完整，请检查设置');
        setOk(false);
        setLoading(false);
        return;
      }
      const svc = new OneNetService(cfg);
      const d = await svc.querySensorData();
      setData(d);
      setOk(true);
      setErr(null);
      setLastTime(new Date().toLocaleTimeString('zh-CN'));
    } catch (e: any) {
      setErr(e.message || '获取数据失败');
      setOk(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const loadInterval = async () => {
      const raw = await AsyncStorage.getItem('onenet_config');
      const interval = raw ? JSON.parse(raw).pollingInterval ?? 5000 : 5000;
      timer.current = setInterval(fetch_, interval);
    };
    loadInterval();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [fetch_]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetch_();
  }, [fetch_]);

  const tempPct = data?.liquidTemp != null ? Math.min(Math.max(data.liquidTemp / 100, 0), 1) : 0;

  /* ─── 加载 / 错误 占位 ─── */
  if (loading && !data) {
    return (
      <LinearGradient colors={[C.bg1, C.bg2]} style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.tempCool} />
          <Text style={s.loadText}>正在获取传感器数据...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (err && !data) {
    return (
      <LinearGradient colors={[C.bg1, C.bg2]} style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.center}>
          <MaterialCommunityIcons name="cloud-off-outline" size={60} color={C.sub} />
          <Text style={s.errText}>{err}</Text>
          <Text style={s.errHint}>请在底部「设置」标签页完成配置</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[C.bg1, C.bg2]} style={[s.root, { paddingTop: insets.top }]}>
      {/* ── 顶栏 ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>IoT 监控面板</Text>
          <Text style={s.subtitle}>OneNet 传感器数据</Text>
        </View>
        <View style={[s.badge, ok ? s.badgeOn : s.badgeOff]}>
          <View style={[s.badgeDot, { backgroundColor: ok ? C.on : C.tempHot }]} />
          <Text style={[s.badgeText, { color: ok ? C.on : C.tempHot }]}>
            {ok ? '已连接' : '未连接'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tempCool} />}
      >
        {/* ── 液体温度 ── */}
        <View style={s.card}>
          <LinearGradient
            colors={[tempColor(data?.liquidTemp) + '14', tempColor(data?.liquidTemp) + '03']}
            style={s.cardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={s.cardHead}>
              <View style={[s.iconCircle, { backgroundColor: tempColor(data?.liquidTemp) + '1A' }]}>
                <MaterialCommunityIcons name="thermometer" size={20} color={tempColor(data?.liquidTemp)} />
              </View>
              <Text style={s.cardLabel}>液体温度</Text>
            </View>
            <View style={s.tempRow}>
              <Text style={[s.tempVal, { color: tempColor(data?.liquidTemp) }]}>
                {data?.liquidTemp != null ? data.liquidTemp.toFixed(1) : '--'}
              </Text>
              <Text style={[s.tempUnit, { color: tempColor(data?.liquidTemp) }]}>°C</Text>
            </View>
            <View style={s.barOuter}>
              <LinearGradient
                colors={[C.tempCold, C.tempCool, C.tempWarm, C.tempHot]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.barFill, { width: `${tempPct * 100}%` }]}
              />
            </View>
            <View style={s.barLabels}>
              <Text style={s.barLabelText}>0°C</Text>
              <Text style={s.barLabelText}>50°C</Text>
              <Text style={s.barLabelText}>100°C</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── 滴速 ── */}
        <View style={s.card}>
          <LinearGradient
            colors={[C.drip + '14', C.drip + '03']}
            style={s.cardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={s.cardHead}>
              <View style={[s.iconCircle, { backgroundColor: C.drip + '1A' }]}>
                <MaterialCommunityIcons name="water-outline" size={20} color={C.drip} />
              </View>
              <Text style={s.cardLabel}>滴速</Text>
            </View>
            <View style={s.dripRow}>
              <Text style={[s.dripVal, { color: C.drip }]}>
                {data?.dripRate != null ? data.dripRate : '--'}
              </Text>
              <Text style={s.dripUnit}>滴/分</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── 设备状态 ── */}
        <Text style={s.section}>设备状态</Text>
        <View style={s.grid}>
          <DeviceCard icon="water-pump" label="水泵" active={data?.pumpOn ?? false} color={C.pump} />
          <DeviceCard icon="fan" label="风扇" active={data?.fanOn ?? false} color={C.fan} />
          <DeviceCard icon="radiator" label="PTC 加热器" active={data?.ptcHeaterOn ?? false} color={C.heater} />
          <DeviceCard icon="lightbulb-on-outline" label="消毒灯带" active={data?.uvLightOn ?? false} color={C.uv} />
        </View>

        {/* ── 时间戳 ── */}
        <Text style={s.lastUp}>上次更新: {lastTime}</Text>
        {err && <Text style={s.warnText}>{err}</Text>}
        <View style={{ height: 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

/* ─── 样式 ─── */
const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadText: { color: C.sub, marginTop: 16, fontSize: 15 },
  errText: { color: C.white, fontSize: 15, marginTop: 20, textAlign: 'center' },
  errHint: { color: C.sub, fontSize: 13, marginTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { color: C.white, fontSize: 22, fontWeight: '700' },
  subtitle: { color: C.sub, fontSize: 13, marginTop: 2 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeOn: { backgroundColor: 'rgba(102,187,106,0.12)', borderColor: 'rgba(102,187,106,0.25)' },
  badgeOff: { backgroundColor: 'rgba(255,107,107,0.12)', borderColor: 'rgba(255,107,107,0.25)' },
  badgeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardInner: { padding: 20 },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardLabel: { color: C.sub, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },

  /* 温度 */
  tempRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
  tempVal: { fontSize: 52, fontWeight: '200', lineHeight: 56 },
  tempUnit: { fontSize: 22, fontWeight: '300', marginBottom: 6, marginLeft: 4 },
  barOuter: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', borderRadius: 3 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabelText: { color: C.sub, fontSize: 10 },

  /* 滴速 */
  dripRow: { flexDirection: 'row', alignItems: 'flex-end' },
  dripVal: { fontSize: 48, fontWeight: '200', lineHeight: 52 },
  dripUnit: { color: C.sub, fontSize: 16, marginBottom: 6, marginLeft: 6 },

  /* 设备状态 */
  section: {
    color: C.sub,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  devCard: {
    width: HALF_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: CARD_GAP,
    overflow: 'hidden',
  },
  devCardInner: { padding: 16, alignItems: 'center' },
  devIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  devLabel: { color: C.white, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  devStatusRow: { flexDirection: 'row', alignItems: 'center' },
  devDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  devStatus: { fontSize: 12, fontWeight: '500' },

  lastUp: { color: C.sub, fontSize: 11, textAlign: 'center', marginTop: 8 },
  warnText: { color: C.tempHot, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
