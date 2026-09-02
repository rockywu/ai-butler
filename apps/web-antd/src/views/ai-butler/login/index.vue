<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Button, Input, message, Tabs } from 'ant-design-vue';

type LoginTab = 'code' | 'password';

const activeTab = ref<LoginTab>('code');
const phone = ref('138****6688');
const code = ref('');
const password = ref('');
const agreed = ref(true);
const counting = ref(false);
const countdown = ref(0);

const isCodeTab = computed(() => activeTab.value === 'code');
const canSubmit = computed(() => {
  if (!agreed.value) return false;
  if (isCodeTab.value) {
    return phone.value.length >= 4 && code.value.length > 0;
  }
  return phone.value.length >= 4 && password.value.length > 0;
});

let timer: null | ReturnType<typeof setInterval> = null;

function sendCode() {
  if (counting.value) return;
  counting.value = true;
  countdown.value = 60;
  message.success('验证码已发送（演示）');
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      counting.value = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  }, 1000);
}

function onLogin() {
  if (!canSubmit.value) return;
  message.loading({ content: '正在登录…', duration: 0.8 });
  setTimeout(() => {
    message.success('登录成功 · 已绑定本机设备 WIN-001');
  }, 800);
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] p-6"
  >
    <div class="w-full max-w-[380px]">
      <div class="mb-5 flex items-center justify-center gap-2.5">
        <div
          class="grid h-[42px] w-[42px] place-items-center rounded-[12px] bg-gradient-to-br from-[#4B3FE3] to-[#7C3AED] text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(75,63,227,0.35)]"
        >
          AS
        </div>
        <div class="text-left">
          <div class="text-[20px] font-bold leading-tight">阿斯系统</div>
          <div class="text-[11px] font-normal text-[#6B7280]">
            AI 超级员工 · V1.0
          </div>
        </div>
      </div>

      <div
        class="rounded-[14px] border border-[#E5E7EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.07)]"
      >
        <Tabs v-model:active-key="activeTab" centered class="mb-4">
          <Tabs.TabPane key="code" tab="验证码登录" />
          <Tabs.TabPane key="password" tab="密码登录" />
        </Tabs>

        <div class="flex flex-col gap-3">
          <Input
            v-model:value="phone"
            size="large"
            placeholder="请输入手机号"
            allow-clear
          >
            <template #prefix>
              <span class="text-[#9CA3AF]">📱</span>
            </template>
          </Input>

          <div v-if="isCodeTab" class="flex gap-2.5">
            <Input
              v-model:value="code"
              size="large"
              placeholder="请输入验证码"
              class="flex-1"
            >
              <template #prefix>
                <span class="text-[#9CA3AF]">🔑</span>
              </template>
            </Input>
            <Button
              size="large"
              :type="counting ? 'default' : 'primary'"
              :ghost="!counting"
              :disabled="counting"
              class="w-[120px]"
              @click="sendCode"
            >
              {{ counting ? `${countdown}s 后重试` : '获取验证码' }}
            </Button>
          </div>

          <Input.Password
            v-else
            v-model:value="password"
            size="large"
            placeholder="请输入密码"
          >
            <template #prefix>
              <span class="text-[#9CA3AF]">🔒</span>
            </template>
          </Input.Password>

          <Button
            type="primary"
            size="large"
            block
            :disabled="!canSubmit"
            @click="onLogin"
          >
            登 录
          </Button>

          <label
            class="flex items-start gap-1.5 text-[12px] leading-relaxed text-[#6B7280]"
          >
            <input
              v-model="agreed"
              type="checkbox"
              class="mt-[3px] accent-[#4B3FE3]"
            />
            <span>
              我已阅读并同意
              <a class="cursor-pointer text-[#4B3FE3]">《服务协议》</a>
              和
              <a class="cursor-pointer text-[#4B3FE3]">《隐私政策》</a>
            </span>
          </label>
        </div>
      </div>

      <div
        class="mt-4 rounded-[10px] bg-[#EDEEFE] px-3 py-2.5 text-center text-[12px] leading-relaxed text-[#6B7280]"
      >
        🖥 首次登录将自动绑定当前设备：<b class="text-[#111827]">WIN-001</b>
        <br />
        登录后登录态保存在本机，再次打开免登录
      </div>
    </div>
  </div>
</template>
