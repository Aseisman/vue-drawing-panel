<script setup lang="ts">
import {
  Setting,
  Back,
  Delete,
  Download,
  VideoPlay,
} from "@element-plus/icons-vue";
import { ref } from "vue";

defineProps({
  lineWidth: {
    type: String,
    default: "10",
  },
  strokeColor: {
    type: String,
    default: "rgba(0,0,0,0.6)",
  },
});

defineEmits([
  "update:lineWidth",
  "update:strokeColor",
  "revoke",
  "clear",
  "download",
  "play",
]);

const predefineColors = ref([
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "rgba(255, 69, 0, 0.68)",
  "rgb(255, 120, 0)",
  "hsv(51, 100, 98)",
  "hsva(120, 40, 94, 0.5)",
  "hsl(181, 100%, 37%)",
  "hsla(209, 100%, 56%, 0.73)",
  "#c7158577",
]);
const showPopper = ref(false);
const reference = ref();

const handleClick = () => {
  showPopper.value = !showPopper.value;
};
</script>

<template>
  <el-popover placement="bottom" :width="300" :visible="showPopper">
    <template #reference>
      <el-button :icon="Setting" class="setting-button" @click="handleClick" />
    </template>
    <template #default>
      <div class="setting-dropdown" ref="reference">
        <div class="control-item">
          <span>线宽：</span>
          <el-input
            style="width: 200px"
            type="number"
            :modelValue="lineWidth"
            @update:modelValue="$emit('update:lineWidth', $event)"
          />
        </div>
        <div class="control-item">
          <span>颜色：</span>
          <el-color-picker
            popperAppendToBody="false"
            :modelValue="strokeColor"
            @update:modelValue="$emit('update:strokeColor', $event)"
            show-alpha
            :predefine="predefineColors"
          />
          {{ strokeColor }}
          <!-- @change = handleClick -->
        </div>
        <div class="control-item">
          <span>撤销：</span>
          <el-button :icon="Back" class="ui-icon" @click="$emit('revoke')" />
        </div>
        <div class="control-item">
          <span>清除：</span>
          <el-button :icon="Delete" class="ui-icon" @click="$emit('clear')" />
        </div>
        <div class="control-item">
          <span>下载：</span>
          <el-button
            :icon="Download"
            class="ui-icon"
            @click="$emit('download')"
          />
        </div>
        <div class="control-item">
          <span>播放：</span>
          <el-button :icon="VideoPlay" class="ui-icon" @click="$emit('play')" />
        </div>
      </div>
    </template>
  </el-popover>
</template>

<style scoped>
.setting-button {
  position: fixed;
  top: 0;
  left: 0;
  margin: 24px;
  z-index: 10;
}
.setting-dropdown {
  padding: 10px 16px;
  color: var(--fontColorNormal);
  line-height: 40px;
  border: 1px solid var(--borderColor);
  border-radius: 4px;
  background-color: var(--whiteColor);
}
.setting-dropdown .control-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}
</style>
