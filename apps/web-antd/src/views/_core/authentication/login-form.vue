<script lang="ts" setup>
import type { VbenFormSchema } from '@vben-core/form-ui';

import type { LoginTab } from '#/views/ai-butler/_shared/login-payload';

import { computed, onBeforeUnmount, reactive, ref } from 'vue';

import { useVbenForm } from '@vben-core/form-ui';
import { VbenButton, VbenCheckbox } from '@vben-core/shadcn-ui';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';
import { toAuthLoginPayload } from '#/views/ai-butler/_shared/login-payload';

defineOptions({ name: 'LoginForm' });

const authStore = useAuthStore();
const activeTab = ref<LoginTab>('code');
const agreed = ref(true);
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | undefined;
const loginTabs: Array<{ label: string; value: LoginTab }> = [
  { label: '验证码登录', value: 'code' },
  { label: '密码登录', value: 'pwd' },
];
const codeValues = reactive({
  code: '',
  phone: '138****6688',
});
const pwdValues = reactive({
  password: '123456',
  phone: 'vben',
});
const loginDisabled = computed(() => {
  if (!agreed.value) return true;

  return activeTab.value === 'code'
    ? !codeValues.phone.trim() || !codeValues.code.trim()
    : !pwdValues.phone.trim() || !pwdValues.password.trim();
});

const codeSchema: VbenFormSchema[] = [
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: '请输入手机号',
    },
    defaultValue: '138****6688',
    fieldName: 'phone',
    label: '手机号',
    rules: 'required',
  },
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: '请输入验证码',
    },
    fieldName: 'code',
    label: '验证码',
    rules: 'required',
  },
];

const pwdSchema: VbenFormSchema[] = [
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: '请输入手机号',
    },
    defaultValue: 'vben',
    fieldName: 'phone',
    label: '手机号',
    rules: 'required',
  },
  {
    component: 'VbenInputPassword',
    componentProps: {
      placeholder: '请输入密码',
    },
    defaultValue: '123456',
    fieldName: 'password',
    label: '密码',
    rules: 'required',
  },
];

const commonFormConfig = {
  commonConfig: {
    hideLabel: true,
    hideRequiredMark: true,
  },
  showDefaultActions: false,
};

const [CodeForm, codeFormApi] = useVbenForm({
  ...commonFormConfig,
  handleValuesChange(values) {
    Object.assign(codeValues, values);
  },
  schema: codeSchema,
});
const [PwdForm, pwdFormApi] = useVbenForm({
  ...commonFormConfig,
  handleValuesChange(values) {
    Object.assign(pwdValues, values);
  },
  schema: pwdSchema,
});

async function handleSubmit() {
  if (!agreed.value) {
    message.warning('请先阅读并同意服务协议和隐私政策');
    return;
  }

  const formApi = activeTab.value === 'code' ? codeFormApi : pwdFormApi;
  const { valid } = await formApi.validate();
  if (!valid) return;

  const values = await formApi.getValues();
  const payload = toAuthLoginPayload({
    tab: activeTab.value,
    phone: String(values.phone ?? ''),
    code: String(values.code ?? ''),
    password: String(values.password ?? ''),
  });
  await authStore.authLogin(payload);
}

function sendCode() {
  if (countdown.value > 0) return;

  message.success('验证码已发送（演示）');
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = undefined;
    }
  }, 1000);
}

function showAgreement() {
  message.info('演示：协议文本');
}

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>

<template>
  <div class="w-full min-w-0" @keydown.enter.prevent="handleSubmit">
    <div
      class="mb-4 flex min-w-0 gap-1 rounded-xl border border-[#E2E1DB] bg-[#F0F0EC] p-1"
    >
      <button
        v-for="tab in loginTabs"
        :key="tab.value"
        class="min-w-0 flex-1 rounded-lg px-2 py-2 text-[12px] transition-colors sm:px-3 sm:text-[13px]"
        :class="
          activeTab === tab.value
            ? 'bg-[#0A0A0A] font-semibold text-white'
            : 'text-[#77736B] hover:text-[#0A0A0A]'
        "
        type="button"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex flex-col gap-[13px]">
      <CodeForm v-if="activeTab === 'code'" />
      <PwdForm v-else />

      <VbenButton
        v-if="activeTab === 'code'"
        class="w-full"
        :disabled="countdown > 0"
        variant="outline"
        @click="sendCode"
      >
        {{ countdown > 0 ? `${countdown}s 后重新获取` : '获取验证码' }}
      </VbenButton>

      <VbenButton
        :loading="authStore.loginLoading"
        aria-label="login"
        class="w-full bg-[#0A0A0A] shadow-[4px_4px_0_#D6D5CF] hover:bg-[#242424]"
        :disabled="loginDisabled"
        @click="handleSubmit"
      >
        登 录
      </VbenButton>

      <div
        class="min-w-0 [&_div]:min-w-0 [&_div]:items-start [&_label]:min-w-0 [&_label]:flex-1 [&_label]:whitespace-normal [&_label]:leading-relaxed"
      >
        <VbenCheckbox v-model="agreed" name="agreement">
          <span class="break-words text-xs leading-relaxed text-[#77736B]">
            我已阅读并同意
            <button
              class="text-[#0A0A0A] underline underline-offset-2"
              type="button"
              @click.stop="showAgreement"
            >
              《服务协议》
            </button>
            和
            <button
              class="text-[#0A0A0A] underline underline-offset-2"
              type="button"
              @click.stop="showAgreement"
            >
              《隐私政策》
            </button>
          </span>
        </VbenCheckbox>
      </div>
    </div>
  </div>
</template>
