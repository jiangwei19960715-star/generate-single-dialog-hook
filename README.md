# generate-single-dialog-hook

一个用于创建**单例对话框 Hook** 的 React 工具函数。通过模块级闭包共享 `show` / `hide` 方法，确保全局只有一个组件实例控制对话框的显示与隐藏。

## 解决的痛点

在复杂应用中，多个页面/组件可能需要触发同一个对话框（如新建、编辑弹窗）。如果每个组件都各自管理对话框状态，会导致：

- DOM 中存在多个相同的对话框节点
- 状态管理混乱，难以保证唯一性
- 不必要的性能开销

`generateSingleDialogHook` 将 `show` / `hide` 方法提升到**模块级闭包**中共享，配合组件级 `mount` 标记，保证**只有传入 `mount=true` 的组件实例**才真正渲染对话框内容。

## 安装

```bash
npm install generate-single-dialog-hook
```

### Peer Dependencies

- `react` >= 16

## 快速开始

推荐的使用模式：**父组件负责挂载 Dialog 并提供 Context，子组件仅调用 `show` 触发显示。** Dialog 渲染函数内部通过 `useContext` 读取父组件提供的数据，实现数据流向清晰、职责分离。

### 1. 定义 Context 与对话框 Hook

```tsx
import { generateSingleDialogHook } from 'generate-single-dialog-hook';
import { Modal, Form, Input } from 'antd';

// 定义 Payload
interface Payload {
  visible: boolean;
  onSuccess?: () => void;
}

// 定义对话框 Hook
export const useModal = generateSingleDialogHook<'useModal', Payload>(
  'EditUserModal',
  ({ payload, setPayload }) => {
    // 因为dialog是挂载在组件下面的，所有可以调用Context获取数据

    const handleOk = async () => {
      payload.onSuccess?.();
      setPayload({ visible: false });
    };

    return (
      <Modal
        title={`编辑用户 - ${username}`}
        open={payload.visible}
        onOk={handleOk}
        onCancel={() => setPayload({ visible: false })}
      >
        modal content
      </Modal>
    );
  },
);
```

### 2. 父组件挂载 Dialog

```tsx
function ParentPage() {
  const { showEditUserModal, EditUserModal } = useEditUserModal(true);

  return (
    <UserContext.Provider value={{ userId: '123', username: 'Alice' }}>
      <ChildComponent />
      {EditUserModal}
    </UserContext.Provider>
  );
}
```

### 3. 子组件仅调用 show 触发显示

```tsx
function ChildComponent() {
  // mount=false：子组件不渲染 Dialog，仅获取 show / hide 方法
  const { showEditUserModal } = useEditUserModal();

  return (
    <button
      onClick={() =>
        showEditUserModal({
          onSuccess: () => {
            // 点击弹框的确定按钮触发
          },
        })
      }
    >
      show dialog
    </button>
  );
}
```

## 开发

```bash
# 安装依赖
npm install

# 启动 Playground
npm run play

# 运行测试
npm run test

# 构建
npm run build

# 类型检查
npm run typecheck
```
