import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { generateSingleDialogHook } from '../src/generateSingleDialog';

// ---------------------------------------------------------------------------
// Test payload & dialog definition
// ---------------------------------------------------------------------------

interface TestPayload {
  visible: boolean;
  title: string;
  message: string;
}

const useTestDialog = generateSingleDialogHook<'TestDialog', TestPayload>(
  'TestDialog',
  ({ payload, setPayload }) =>
    payload.visible ? (
      <div data-testid="dialog">
        <span data-testid="title">{payload.title}</span>
        <span data-testid="message">{payload.message}</span>
        <button
          data-testid="update"
          onClick={() => setPayload({ ...payload, message: 'updated' })}
        >
          Update
        </button>
      </div>
    ) : (
      <></>
    ),
);

// ---------------------------------------------------------------------------
// Test host component
// ---------------------------------------------------------------------------

const DialogHost: React.FC<{
  mount?: boolean;
  showTitle?: string;
  showMessage?: string;
}> = ({ mount, showTitle = 'default', showMessage = 'hello' }) => {
  const { TestDialog, showTestDialog, hideTestDialog } = useTestDialog(mount);

  return (
    <div>
      <span data-testid="has-dialog">{String(TestDialog !== null)}</span>
      <button
        data-testid="show"
        onClick={() => showTestDialog({ title: showTitle, message: showMessage })}
      >
        Show
      </button>
      <button data-testid="hide" onClick={hideTestDialog}>
        Hide
      </button>
      {TestDialog}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateSingleDialogHook', () => {
  // -- 挂载实例 (mount=true) ------------------------------------------------

  describe('挂载实例 (mount=true)', () => {
    test('调用 show 后对话框变为可见，并携带正确的 payload', async () => {
      const screen = await render(<DialogHost mount={true} />);

      await expect.element(screen.getByTestId('dialog')).not.toBeInTheDocument();

      await screen.getByTestId('show').click();

      await expect.element(screen.getByTestId('dialog')).toBeVisible();
      await expect.element(screen.getByTestId('title')).toHaveTextContent('default');
      await expect.element(screen.getByTestId('message')).toHaveTextContent('hello');
    });

    test('调用 hide 后对话框隐藏', async () => {
      const screen = await render(<DialogHost mount={true} />);

      await screen.getByTestId('show').click();
      await expect.element(screen.getByTestId('dialog')).toBeVisible();

      await screen.getByTestId('hide').click();
      await expect.element(screen.getByTestId('dialog')).not.toBeInTheDocument();
    });

    test('hide 后再次 show 可以重新显示对话框', async () => {
      const screen = await render(<DialogHost mount={true} />);

      await screen.getByTestId('show').click();
      await expect.element(screen.getByTestId('dialog')).toBeVisible();

      await screen.getByTestId('hide').click();
      await expect.element(screen.getByTestId('dialog')).not.toBeInTheDocument();

      await screen.getByTestId('show').click();
      await expect.element(screen.getByTestId('dialog')).toBeVisible();
    });
  });

  // -- setPayload -----------------------------------------------------------

  describe('setPayload 局部更新', () => {
    test('展开当前 payload 来局部更新，不影响其他字段', async () => {
      const screen = await render(<DialogHost mount={true} />);

      await screen.getByTestId('show').click();
      await expect.element(screen.getByTestId('message')).toHaveTextContent('hello');

      // setPayload 是 useState 的 setter，需手动展开 payload
      await screen.getByTestId('update').click();
      await expect.element(screen.getByTestId('message')).toHaveTextContent('updated');
      // title 不受影响
      await expect.element(screen.getByTestId('title')).toHaveTextContent('default');
    });
  });

  // -- 非挂载实例 (mount=false) ---------------------------------------------

  describe('非挂载实例 (mount=false)', () => {
    test('对话框节点为 null', async () => {
      const screen = await render(<DialogHost mount={false} />);

      await expect.element(screen.getByTestId('has-dialog')).toHaveTextContent('false');
      expect(screen.container.querySelector('[data-testid="dialog"]')).toBeNull();
    });

    test('show/hide 方法与挂载实例共享同一个函数引用，非挂载实例可控制对话框', async () => {
      // 用独立子组件避免同一组件内两个 hook 互相干扰
      function HostComponent() {
        const { TestDialog } = useTestDialog(true);
        return <>{TestDialog}</>;
      }

      function TriggerComponent() {
        const { showTestDialog, hideTestDialog, TestDialog } = useTestDialog(false);
        return (
          <div>
            <span data-testid="trigger-has">{String(TestDialog !== null)}</span>
            <button
              data-testid="trigger-show"
              onClick={() =>
                showTestDialog({ title: 'from-trigger', message: 'hi' })
              }
            >
              Trigger Show
            </button>
            <button data-testid="trigger-hide" onClick={hideTestDialog}>
              Trigger Hide
            </button>
          </div>
        );
      }

      function Parent() {
        return (
          <div>
            <HostComponent />
            <TriggerComponent />
          </div>
        );
      }

      const screen = await render(<Parent />);

      // 非挂载实例不渲染对话框
      await expect.element(screen.getByTestId('trigger-has')).toHaveTextContent('false');

      // 非挂载实例调用 show —— 实际操作的是 HostComponent 的状态
      await screen.getByTestId('trigger-show').click();
      await expect.element(screen.getByTestId('dialog')).toBeVisible();
      await expect.element(screen.getByTestId('title')).toHaveTextContent('from-trigger');

      // 非挂载实例调用 hide
      await screen.getByTestId('trigger-hide').click();
      await expect.element(screen.getByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  // -- 多个挂载实例 ---------------------------------------------------------

  describe('多个挂载实例', () => {
    test('每个 mount=true 的实例各自渲染对话框并独立控制', async () => {
      function FirstHost() {
        const { showTestDialog, hideTestDialog, TestDialog } = useTestDialog(true);
        return (
          <div>
            <span data-testid="first-has">{String(TestDialog !== null)}</span>
            <button
              data-testid="first-show"
              onClick={() => showTestDialog({ title: 'first-dialog', message: 'a' })}
            >
              First Show
            </button>
            <button data-testid="first-hide" onClick={hideTestDialog}>
              First Hide
            </button>
            {TestDialog}
          </div>
        );
      }

      function SecondHost() {
        const { showTestDialog, hideTestDialog, TestDialog } = useTestDialog(true);
        return (
          <div>
            <span data-testid="second-has">{String(TestDialog !== null)}</span>
            <button
              data-testid="second-show"
              onClick={() => showTestDialog({ title: 'second-dialog', message: 'b' })}
            >
              Second Show
            </button>
            <button data-testid="second-hide" onClick={hideTestDialog}>
              Second Hide
            </button>
            {TestDialog}
          </div>
        );
      }

      function Parent() {
        return (
          <div>
            <FirstHost />
            <SecondHost />
          </div>
        );
      }

      const screen = await render(<Parent />);

      // 两个实例都渲染了对话框节点
      await expect.element(screen.getByTestId('first-has')).toHaveTextContent('true');
      await expect.element(screen.getByTestId('second-has')).toHaveTextContent('true');

      // FirstHost 控制自己的对话框
      await screen.getByTestId('first-show').click();
      await expect.element(screen.getByTestId('dialog')).toBeVisible();
      await expect.element(screen.getByTestId('title')).toHaveTextContent('first-dialog');

      await screen.getByTestId('first-hide').click();
      await expect.element(screen.getByTestId('dialog')).not.toBeInTheDocument();

      // SecondHost 控制自己的对话框
      await screen.getByTestId('second-show').click();
      await expect.element(screen.getByTestId('dialog')).toBeVisible();
      await expect.element(screen.getByTestId('title')).toHaveTextContent('second-dialog');

      await screen.getByTestId('second-hide').click();
      await expect.element(screen.getByTestId('dialog')).not.toBeInTheDocument();
    });

    test('后挂载的 mount=true 实例会覆盖模块级 show/hide，影响后续 mount=false 实例', async () => {
      // mount=true 的实例各自独立，但最后一个 mount=true 会更新模块级闭包，
      // 后续 mount=false 的实例共享的是最后一个 mount=true 的 show/hide

      function FirstHost() {
        const { TestDialog } = useTestDialog(true);
        return <>{TestDialog}</>;
      }

      function SecondHost() {
        const { TestDialog } = useTestDialog(true);
        return <>{TestDialog}</>;
      }

      function Trigger() {
        const { showTestDialog, hideTestDialog, TestDialog } = useTestDialog(false);
        return (
          <div>
            <span data-testid="trigger-has">{String(TestDialog !== null)}</span>
            <button
              data-testid="trigger-show"
              onClick={() => showTestDialog({ title: 'from-trigger', message: 'x' })}
            >
              Trigger Show
            </button>
            <button data-testid="trigger-hide" onClick={hideTestDialog}>
              Trigger Hide
            </button>
          </div>
        );
      }

      function Parent() {
        return (
          <div>
            <FirstHost />
            <SecondHost />
            <Trigger />
          </div>
        );
      }

      const screen = await render(<Parent />);

      // Trigger（mount=false）不渲染对话框
      await expect.element(screen.getByTestId('trigger-has')).toHaveTextContent('false');

      // Trigger 调用 show —— 控制的是 SecondHost（最后一个 mount=true）的对话框
      await screen.getByTestId('trigger-show').click();
      await expect.element(screen.getByTestId('dialog')).toBeVisible();
      await expect.element(screen.getByTestId('title')).toHaveTextContent('from-trigger');

      // Trigger 调用 hide
      await screen.getByTestId('trigger-hide').click();
      await expect.element(screen.getByTestId('dialog')).not.toBeInTheDocument();
    });
  });
});
