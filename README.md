# generate-single-dialog-hook

一个用于创建**单例对话框 Hook** 的 React 工具函数。确保全局只有一个对话框实例被渲染，解决多个组件同时挂载同一对话框时的重复渲染问题。

## 解决的痛点

在复杂应用中，多个页面/组件可能需要触发同一个对话框（如新建、编辑弹窗）。如果每个组件都各自渲染对话框，会导致：

- DOM 中存在多个相同的对话框节点
- 状态管理混乱，难以保证唯一性
- 不必要的性能开销

`generateSingleDialogHook` 通过模块级闭包共享状态 + 组件级 `mount` 标记，保证**只有最后挂载的组件实例**才真正渲染对话框内容。

## 安装

```bash
npm install generate-single-dialog-hook
```

### Peer Dependencies

- `react` >= 16.0.0

## 快速开始

### 1. 定义对话框 Hook

```tsx
import { generateSingleDialogHook } from 'generate-single-dialog-hook';
import { Modal, Form, Input } from 'antd';

interface Payload {
  visible: boolean;
  onSuccess?: (values: Record<string, any>) => void;
}

export const useTestModal = generateSingleDialogHook<'TestModal', Payload>(
  'TestModal',
  ({ payload, setPayload }) => {
    const [form] = Form.useForm();

    const handleOk = async () => {
      const values = await form.validateFields();
      payload.onSuccess?.(values);
      setPayload({ visible: false });
    };

    return (
      <Modal
        title="Test Modal"
        open={payload.visible}
        onOk={handleOk}
        onCancel={() => setPayload({ visible: false })}
      >
        <Form form={form}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    );
  },
);
```

### 2. 在组件中使用

```tsx
function MyPage() {
  // mount=true 表示此组件作为对话框的宿主
  const { showTestModal, TestModal } = useTestModal(true);

  const handleClick = () => {
    showTestModal({
      onSuccess: (values) => {
        console.log('表单数据:', values);
      },
    });
  };

  return (
    <div>
      <button onClick={handleClick}>打开对话框</button>
      {TestModal}
    </div>
  );
}
```

## API

### `generateSingleDialogHook(name, renderDialog)`

创建一个单例对话框 Hook。

**参数：**

| 参数           | 类型                                      | 说明                                                            |
| -------------- | ----------------------------------------- | --------------------------------------------------------------- |
| `name`         | `string` (必须以字面量类型传入)           | 对话框名称，用于生成对应的 `show*`/`hide*` 方法和 ReactNode key |
| `renderDialog` | `(params: IRenderDialog<P>) => ReactNode` | 对话框渲染函数，接收 `payload` 和 `setPayload`                  |

**返回值：**

一个 Hook 函数 `(mount?: boolean) => DialogHookResult`，调用后返回：

| 属性          | 类型                                    | 说明                                           |
| ------------- | --------------------------------------- | ---------------------------------------------- |
| `[name]`      | `ReactNode`                             | 对话框的 React 节点，需在 JSX 中渲染           |
| `show${Name}` | `(payload: Omit<P, 'visible'>) => void` | 显示对话框，传入除 `visible` 外的 payload 字段 |
| `hide${Name}` | `() => void`                            | 隐藏对话框                                     |

**泛型参数：**

| 泛型 | 约束                   | 说明                                             |
| ---- | ---------------------- | ------------------------------------------------ |
| `N`  | `string`               | 对话框名称的字面量类型                           |
| `P`  | `extends IPayloadBase` | 自定义 Payload 类型，必须包含 `visible: boolean` |

### `IRenderDialog<P>`

```ts
interface IRenderDialog<P extends IPayloadBase> {
  payload: P; // 当前 payload（包含 visible）
  setPayload: (payload: Partial<P>) => void; // 更新 payload
}
```

### `IPayloadBase`

```ts
interface IPayloadBase {
  visible: boolean;
  [key: string]: any; // 允许任意扩展字段
}
```

## 工作原理

1. **模块级闭包变量**：`interfaceId`、`showDialog`、`hideDialog` 在模块作用域定义，所有调用同一 Hook 的组件实例共享这些变量。

2. **mount 标记**：传入 `mount=true` 的组件实例会注册自己为对话框宿主（设置 `interfaceId`），只有宿主实例才会渲染对话框内容。

3. **后挂载优先**：当多个组件传入 `mount=true`，最后挂载的实例取得对话框所有权，之前的宿主自动失去对话框。

4. **id 匹配**：通过 React 的 `useId()` 生成的唯一 id 与 `interfaceId` 比对，确保只有当前宿主渲染对话框。

```ts
// 核心判断逻辑
[name]: interfaceId === id
  ? renderDialog({ payload, setPayload })
  : null
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

## License

MIT
