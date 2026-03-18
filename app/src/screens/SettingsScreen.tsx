import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OneNetConfig,
  OneNetService,
  DEFAULT_CONFIG,
  DEFAULT_PROPERTY_KEYS,
} from '../services/onenet';

const C = {
  bg1: '#0A0E27',
  bg2: '#151A3A',
  white: '#FFFFFF',
  sub: 'rgba(255,255,255,0.5)',
  accent: '#4FC3F7',
  cardBorder: 'rgba(255,255,255,0.07)',
  inputBg: 'rgba(255,255,255,0.05)',
  success: '#66BB6A',
  error: '#FF6B6B',
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor="rgba(255,255,255,0.2)"
        selectionColor={C.accent}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [cfg, setCfg] = useState<OneNetConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('onenet_config');
      if (raw) setCfg(JSON.parse(raw));
    })();
  }, []);

  const update = (key: keyof OneNetConfig, val: any) => {
    setCfg((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const updateKey = (key: keyof typeof DEFAULT_PROPERTY_KEYS, val: string) => {
    setCfg((prev) => ({
      ...prev,
      propertyKeys: { ...prev.propertyKeys, [key]: val },
    }));
    setSaved(false);
  };

  const save = async () => {
    await AsyncStorage.setItem('onenet_config', JSON.stringify(cfg));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    if (!cfg.productId || !cfg.deviceName || !cfg.accessKey) {
      Alert.alert('提示', '请先填写产品ID、设备名称和AccessKey');
      return;
    }
    setTesting(true);
    try {
      const svc = new OneNetService(cfg);
      await svc.querySensorData();
      Alert.alert('连接成功', '已成功从 OneNet 获取到设备数据');
    } catch (e: any) {
      Alert.alert('连接失败', e.message || '请检查配置信息是否正确');
    } finally {
      setTesting(false);
    }
  };

  const resetKeys = () => {
    setCfg((prev) => ({ ...prev, propertyKeys: { ...DEFAULT_PROPERTY_KEYS } }));
    setSaved(false);
  };

  return (
    <LinearGradient colors={[C.bg1, C.bg2]} style={[s.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 顶栏 */}
        <View style={s.header}>
          <Text style={s.title}>设置</Text>
          <Text style={s.subtitle}>配置 OneNet 平台连接信息</Text>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 连接配置 ── */}
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="cloud-outline" size={18} color={C.accent} />
            <Text style={s.sectionTitle}>连接配置</Text>
          </View>
          <View style={s.card}>
            <Field
              label="产品 ID"
              value={cfg.productId}
              onChangeText={(t) => update('productId', t)}
              placeholder="OneNet 产品ID"
            />
            <Field
              label="设备名称"
              value={cfg.deviceName}
              onChangeText={(t) => update('deviceName', t)}
              placeholder="设备名称"
            />
            <Field
              label="Access Key"
              value={cfg.accessKey}
              onChangeText={(t) => update('accessKey', t)}
              placeholder="产品或设备的 AccessKey"
              secure
            />
          </View>

          {/* ── 属性标识符 ── */}
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="tag-outline" size={18} color={C.accent} />
            <Text style={s.sectionTitle}>属性标识符映射</Text>
            <TouchableOpacity onPress={resetKeys} style={s.resetBtn}>
              <Text style={s.resetText}>重置默认</Text>
            </TouchableOpacity>
          </View>
          <View style={s.card}>
            <Field label="液体温度" value={cfg.propertyKeys.liquidTemp} onChangeText={(t) => updateKey('liquidTemp', t)} />
            <Field label="滴速" value={cfg.propertyKeys.dripRate} onChangeText={(t) => updateKey('dripRate', t)} />
            <Field label="水泵开关" value={cfg.propertyKeys.pumpOn} onChangeText={(t) => updateKey('pumpOn', t)} />
            <Field label="风扇开关" value={cfg.propertyKeys.fanOn} onChangeText={(t) => updateKey('fanOn', t)} />
            <Field label="PTC加热器" value={cfg.propertyKeys.ptcHeaterOn} onChangeText={(t) => updateKey('ptcHeaterOn', t)} />
            <Field label="消毒灯带" value={cfg.propertyKeys.uvLightOn} onChangeText={(t) => updateKey('uvLightOn', t)} />
          </View>

          {/* ── 高级设置 ── */}
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="tune-vertical" size={18} color={C.accent} />
            <Text style={s.sectionTitle}>高级设置</Text>
          </View>
          <View style={s.card}>
            <Field
              label="轮询间隔 (毫秒)"
              value={String(cfg.pollingInterval)}
              onChangeText={(t) => update('pollingInterval', parseInt(t) || 5000)}
              placeholder="5000"
            />
          </View>

          {/* ── 操作按钮 ── */}
          <View style={s.btnGroup}>
            <TouchableOpacity style={s.btnPrimary} onPress={save} activeOpacity={0.8}>
              <LinearGradient
                colors={saved ? [C.success, '#43A047'] : [C.accent, '#0288D1']}
                style={s.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons
                  name={saved ? 'check-circle' : 'content-save'}
                  size={18}
                  color="#fff"
                />
                <Text style={s.btnText}>{saved ? '已保存' : '保存配置'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.btnSecondary}
              onPress={testConnection}
              activeOpacity={0.8}
              disabled={testing}
            >
              <MaterialCommunityIcons name="connection" size={18} color={C.accent} />
              <Text style={[s.btnSecText, testing && { opacity: 0.5 }]}>
                {testing ? '测试中...' : '测试连接'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: C.white, fontSize: 22, fontWeight: '700' },
  subtitle: { color: C.sub, fontSize: 13, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    color: C.sub,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 6,
    flex: 1,
  },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  resetText: { color: C.accent, fontSize: 12, fontWeight: '600' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    marginBottom: 14,
  },

  field: { marginBottom: 14 },
  fieldLabel: { color: C.sub, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: C.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.white,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  btnGroup: { marginTop: 8, gap: 10 },
  btnPrimary: { borderRadius: 12, overflow: 'hidden' },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent + '40',
    backgroundColor: C.accent + '08',
    gap: 8,
  },
  btnSecText: { color: C.accent, fontSize: 15, fontWeight: '600' },
});
