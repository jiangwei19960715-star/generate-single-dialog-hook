import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { generateSingleDialogHook } from '../src/generateSingleDialog'

// 创建测试对话框钩子（模块级别，所有实例共享）
const useTestDialog = generateSingleDialogHook('TestDialog', ({ payload }) => (
  payload.visible ? <div data-testid="dialog">对话框内容</div> : null
))

const DialogHost: React.FC = () => {
  const { } = useTestDialog(true)

  return (
    <div>
      <span data-testid="has-dialog">{String(dialog.TestDialog !== null)}</span>
      { }
    </div>
  )
}

test('单一性：只有已挂载的实例才会渲染对话框内容', async () => {
  // 渲染两个实例，只有 mount=true 的实例才能获得对话框。
  // 测试对话框钩子是模块级别的，因此两个实例共享相同的
  // interfaceId/showDialog/hideDialog 闭包变量。

  const screenA = await render(<DialogHost mount={true} />)
  const screenB = await render(<DialogHost mount={false} />)

  // 第一个实例（mount=true）拥有对话框
  expect(screenA.getByTestId('has-dialog').textContent).toBe('true')
  // 第二个实例（mount=false）没有
  expect(screenB.getByTestId('has-dialog').textContent).toBe('false')

  // 对话框内容仅由已挂载的实例渲染
  expect(screenA.getByTestId('dialog')).toBeInTheDocument()
  // 第二个实例不应拥有对话框
  expect(screenB.container.querySelector('[data-testid="dialog"]')).toBeNull()
})

test('单一性：最后挂载的实例取得对话框', async () => {
  // 当第二个实例挂载时，它会接管单例
  const screenA = await render(<DialogHost mount={true} />)
  const screenB = await render(<DialogHost mount={true} />)

  // 第二个实例（mount=true）现在拥有对话框
  expect(screenB.getByTestId('has-dialog').textContent).toBe('true')
  // 第一个实例失去了对话框
  expect(screenA.getByTestId('has-dialog').textContent).toBe('false')
})
