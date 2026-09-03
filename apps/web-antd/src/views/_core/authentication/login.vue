<script lang="ts" setup>
import LoginForm from './login-form.vue';

defineOptions({ name: 'Login' });
</script>

<template>
  <main
    class="grid w-full min-w-0 max-w-full place-items-center overflow-x-hidden overflow-y-auto bg-[#F4F4F1] bg-[linear-gradient(rgba(10,10,10,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,10,10,0.035)_1px,transparent_1px)] bg-[size:28px_28px] p-0 sm:p-2"
  >
    <section class="w-full min-w-0 max-w-[400px]">
      <header class="mb-[22px] flex items-center justify-center gap-3">
        <div
          class="grid size-[45px] place-items-center rounded-lg border border-[#0A0A0A] bg-[#0A0A0A] text-[15px] font-bold tracking-[-0.04em] text-white shadow-[5px_5px_0_#D8D7D0]"
        >
          AS
        </div>
        <div>
          <h1
            class="text-[21px] font-bold leading-tight tracking-[-0.03em] text-[#0A0A0A]"
          >
            阿斯系统
          </h1>
          <p class="text-[11px] text-[#77736B]">智能增长中枢 · V1.0</p>
        </div>
      </header>

      <div
        class="min-w-0 rounded-[18px] border border-[#D1D0C9] bg-white px-4 py-[22px] shadow-[0_18px_50px_rgba(10,10,10,0.09)] sm:px-6 sm:py-[26px]"
      >
        <LoginForm />
      </div>

      <div
        class="mt-[15px] rounded-xl border border-dashed border-[#C9C8C1] bg-[#F0F0EC] px-3 py-2 text-center text-xs leading-relaxed text-[#5B5B56]"
      >
        🖥 首次登录将自动绑定当前设备：WIN-001
        <br />
        登录后登录态保存在本机，再次打开免登录
      </div>
    </section>
  </main>
</template>
