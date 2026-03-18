import CryptoJS from 'crypto-js';

export interface SensorData {
  liquidTemp: number | null;
  dripRate: number | null;
  pumpOn: boolean;
  fanOn: boolean;
  ptcHeaterOn: boolean;
  uvLightOn: boolean;
}

export interface OneNetConfig {
  productId: string;
  deviceName: string;
  accessKey: string;
  propertyKeys: PropertyKeyMap;
  pollingInterval: number;
}

export interface PropertyKeyMap {
  liquidTemp: string;
  dripRate: string;
  pumpOn: string;
  fanOn: string;
  ptcHeaterOn: string;
  uvLightOn: string;
}

export const DEFAULT_PROPERTY_KEYS: PropertyKeyMap = {
  liquidTemp: 'liquid_temp',
  dripRate: 'drip_rate',
  pumpOn: 'pump_switch',
  fanOn: 'fan_switch',
  ptcHeaterOn: 'ptc_heater',
  uvLightOn: 'uv_light',
};

export const DEFAULT_CONFIG: OneNetConfig = {
  productId: '',
  deviceName: '',
  accessKey: '',
  propertyKeys: { ...DEFAULT_PROPERTY_KEYS },
  pollingInterval: 5000,
};

function generateToken(
  productId: string,
  deviceName: string,
  accessKey: string
): string {
  const version = '2018-10-31';
  const et = String(Math.floor(Date.now() / 1000) + 30 * 24 * 3600);
  const method = 'sha256';
  const res = `products/${productId}/devices/${deviceName}`;

  const key = CryptoJS.enc.Base64.parse(accessKey);
  const stringForSign = `${et}\n${method}\n${res}\n${version}`;
  const hmac = CryptoJS.HmacSHA256(stringForSign, key);
  const sign = encodeURIComponent(CryptoJS.enc.Base64.stringify(hmac));
  const encodedRes = encodeURIComponent(res);

  return `version=${version}&res=${encodedRes}&et=${et}&method=${method}&sign=${sign}`;
}

export class OneNetService {
  private config: OneNetConfig;
  private token: string;

  constructor(config: OneNetConfig) {
    this.config = config;
    this.token = generateToken(
      config.productId,
      config.deviceName,
      config.accessKey
    );
  }

  async querySensorData(): Promise<SensorData> {
    const { productId, deviceName } = this.config;
    const url = `https://iot-api.heclouds.com/thingmodel/query-device-property?product_id=${productId}&device_name=${deviceName}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { authorization: this.token },
    });

    if (!response.ok) {
      throw new Error(`请求失败 (HTTP ${response.status})`);
    }

    const json = await response.json();
    if (json.code !== 0) {
      throw new Error(json.msg || `OneNet 错误 (code: ${json.code})`);
    }

    return this.parseSensorData(json.data);
  }

  private parseSensorData(data: any): SensorData {
    const keys = this.config.propertyKeys;

    const findValue = (identifier: string): any => {
      if (!data) return undefined;
      // data 可能是数组或对象，兼容两种格式
      if (Array.isArray(data)) {
        const item = data.find((d: any) => d.identifier === identifier);
        return item?.value;
      }
      if (typeof data === 'object' && data[identifier] !== undefined) {
        const item = data[identifier];
        return typeof item === 'object' ? item.value : item;
      }
      return undefined;
    };

    const toBool = (val: any): boolean => {
      if (val === undefined || val === null) return false;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val !== 0;
      if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true' || val === 'on';
      return false;
    };

    const toNumber = (val: any): number | null => {
      if (val === undefined || val === null) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    return {
      liquidTemp: toNumber(findValue(keys.liquidTemp)),
      dripRate: toNumber(findValue(keys.dripRate)),
      pumpOn: toBool(findValue(keys.pumpOn)),
      fanOn: toBool(findValue(keys.fanOn)),
      ptcHeaterOn: toBool(findValue(keys.ptcHeaterOn)),
      uvLightOn: toBool(findValue(keys.uvLightOn)),
    };
  }
}
