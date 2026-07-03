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

- `react` >= 19.2.0
- `react-dom` >= 19.2.0

## 快速开始

推荐的使用模式：**父组件负责挂载 Dialog 并提供 Context，子组件仅调用 `show` 触发显示。** Dialog 渲染函数内部通过 `useContext` 读取父组件提供的数据，实现数据流向清晰、职责分离。

### 1. 定义 Context 与对话框 Hook

```tsx
import { createContext, useContext } from 'react';
import { generateSingleDialogHook } from 'generate-single-dialog-hook';
import { Modal, Form, Input } from 'antd';

// 定义 Context，用于父组件向 Dialog 传递数据
interface UserContextType {
  userId: string;
  username: string;
}

const UserContext = createContext<UserContextType>({
  userId: '',
  username: '',
});

// 定义 Payload
interface Payload {
  visible: boolean;
  onSuccess?: (values: Record<string, any>) => void;
}

// 定义对话框 Hook
export const useEditUserModal = generateSingleDialogHook<'EditUserModal', Payload>(
  'EditUserModal',
  ({ payload, setPayload }) => {
    // ✅ 在 renderDialog 内部通过 useContext 读取父组件 Context 数据
    const { userId, username } = useContext(UserContext);
    const [form] = Form.useForm();

    const handleOk = async () => {
      const values = await form.validateFields();
      payload.onSuccess?.(values);
      setPayload({ visible: false });
    };

    return (
      <Modal
        title={`编辑用户 - ${username}`}
        open={payload.visible}
        onOk={handleOk}
        onCancel={() => setPayload({ visible: false })}
      >
        <Form form={form}>
          <Form.Item label="用户 ID">
            <Input disabled value={userId} />
          </Form.Item>
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    );
  },
);
```

### 2. 父组件挂载 Dialog 并提供 Context

```tsx
function ParentPage() {
  // mount=true：父组件作为 Dialog 的宿主，负责渲染
  const { showEditUserModal, EditUserModal } = useEditUserModal(true);

  return (
    // 父组件通过 Context.Provider 注入数据，Dialog 渲染时自动消费
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
  const { showEditUserModal } = useEditUserModal(false);

  return (
    <button
      onClick={() =>
        showEditUserModal({
          onSuccess: (values) => {
            console.log('表单数据:', values);
          },
        })
      }
    >
      打开编辑对话框
    </button>
  );
}
```

### 4. 其他页面也可触发（无 Context 时使用默认值）

```tsx
function AnotherPage() {
  const { showEditUserModal } = useEditUserModal(false);

  return (
    <button onClick={() => showEditUserModal({ onSuccess: console.log })}>
      从其他页面打开
    </button>
  );
}
```

## API

### `generateSingleDialogHook(name, renderDialog)`

创建一个单例对话框 Hook。

**参数：**

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string`（必须以字面量类型传入） | 对话框名称，用于生成对应的 `show*` / `hide*` 方法和 ReactNode key |
| `renderDialog` | `(params: IRenderDialog<P>) => ReactNode` | 对话框渲染函数，接收 `payload` 和 `setPayload` |

**返回值：**

一个 Hook 函数 `(mount?: boolean) => DialogHookResult`，调用后返回：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | `ReactNode` | 对话框的 React 节点，`mount=true` 时渲染内容，否则为 `null` |
| `show${Name}` | `(payload: Omit<P, 'visible'>) => void` | 显示对话框，传入除 `visible` 外的 payload 字段 |
| `hide${Name}` | `() => void` | 隐藏对话框 |

**泛型参数：**

| 泛型 | 约束 | 说明 |
| --- | --- | --- |
| `N` | `string` | 对话框名称的字面量类型 |
| `P` | `extends IPayloadBase` | 自定义 Payload 类型，必须包含 `visible: boolean` |

### `IRenderDialog<P>`

```ts
interface IRenderDialog<P extends IPayloadBase> {
  payload: P;                           // 当前 payload（包含 visible）
  setPayload: (payload: Partial<P>) => void;  // 更新 payload（需手动展开当前值）
}
```

### `IPayloadBase`

```ts
interface IPayloadBase {
  visible: boolean;
  [key: string]: any;  // 允许任意扩展字段
}
```

## 工作原理

1. **模块级闭包变量**：`showDialog`、`hideDialog` 在模块作用域定义，所有调用同一 Hook 的组件实例共享这两个变量的引用。

2. **mount=true**：传入 `mount=true` 的组件实例会将模块级的 `showDialog` / `hideDialog` 重新绑定到自己的 `setPayload` 上，并负责渲染对话框内容。每个 `mount=true` 实例的 `showXxx` / `hideXxx` 始终指向自己内部的 `setPayload`，各自独立控制。

3. **mount=false**：不渲染对话框（`[name]` 返回 `null`），但会拿到当前模块级闭包中的 `showXxx` / `hideXxx`（即**最后一个 `mount=true` 实例**绑定的方法），从而可以触发对话框的显示和隐藏。

4. **模块级变量是值捕获**：Hook 返回时，`showXxx` 和 `hideXxx` 获取的是模块级变量**当前指向的函数引用**。后续其他组件对模块级变量的重新赋值不会影响已返回的引用。

```ts
// 核心逻辑
if (mount) {
  // 将模块级方法绑定到当前组件的 setPayload
  showDialog = (next) => setPayload((prev) => ({ ...prev, ...next, visible: true }));
  hideDialog = () => setPayload({ visible: false });
}

return {
  [`show${name}`]: showDialog,   // mount=true: 自己的方法; mount=false: 最后一个 mount=true 的方法
  [`hide${name}`]: hideDialog,
  [name]: mount ? renderDialog(...) : null,  // 仅 mount=true 时渲染
};
```

## 注意事项

- **仅应有一个组件传入 `mount=true`**。多个 `mount=true` 实例各自独立控制自己的对话框，同时会在 DOM 中产生多个对话框节点，破坏单例语义。
- **`mount=true` 的组件卸载后**，模块级 `showDialog` / `hideDialog` 仍持有已卸载组件的 `setPayload`，调用时可能产生 React 警告。建议将 `mount=true` 的组件放在根布局等始终存在的位置。
- **`setPayload` 不会自动合并**，它等价于 `useState` 的 setter。更新时需手动展开当前 payload：`setPayload({ ...payload, field: newValue })`。

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

## License

MIT
