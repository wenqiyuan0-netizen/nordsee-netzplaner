我将根据您的反馈，移除不兼容的 `ReferenceLine` 组件，并全面汉化（德语化）说明文案，同时落实之前规划的“泄洪模式”与“物理惯性”效果。

### 1. 移除不兼容组件与修复图表
*   **删除 `ReferenceLine`**: 在 `Recharts` 图表中移除导致报错或不兼容的 `ReferenceLine` 组件。
*   **替代方案**: 如果需要标记当前时间，我将使用自定义的 `CustomTick` 或在图表外部使用 DOM 覆盖层来指示当前时间点，避免破坏图表渲染。

### 2. 界面逻辑升级：泄洪与惯性 (Discharge & Inertia)
*   **控制逻辑变更**:
    *   **按钮**: 改为 **`NOTABLASS (Notentleerung)`**（紧急泄洪）。
    *   **行为**: 点击后，系统进入“泄洪模式”。
        *   **RPM (转速)**: 模拟物理惯性，指数级缓慢下降至 0 (`RPM * 0.95`).
        *   **Power (功率)**: 迅速切断（发电机脱网），降为 0 MW。
        *   **Flow (流量)**: 保持最大值（旁路阀全开），用于快速降低水位。
        *   **Level (水位)**: 在泄洪模式下快速下降。
*   **UI 升级**:
    *   将原本的数字列表替换为 **三个圆形仪表盘 (Gauges)**：`Drehzahl` (RPM), `Leistung` (MW), `Durchfluss` (m³/s)。
    *   保持“明亮舒适”的白底 UI 风格。

### 3. 全面德语化 (German Localization)
*   确保所有新增的标签、说明文字均为标准德语。
    *   "Emergency Discharge" -> **"Notablass / Bypass"**
    *   "Inertia Stopping" -> **"Auslaufbetrieb"**
    *   说明文案："Bei Erreichen des maximalen Füllstands (100%) wird der Notablass aktiviert, um das Oberbecken über den Bypass zu entleeren. Die Turbine geht in den Leerlauf." (当达到最大水位 100% 时，激活紧急泄洪，通过旁路排空上水库。涡轮机进入空转/停机状态。)

这个方案既解决了代码兼容性问题，又提升了物理仿真的真实感。我将立即开始执行。