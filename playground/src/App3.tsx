import { Button } from 'antd';
import { useTestModal } from './useTestModal';

export function App3() {
  const { showTestModal, TestModal } = useTestModal(true);

  const handleClick = () => {
    showTestModal({
      data: { name: '3' },
      success: async (values) => {
        console.log(values);
      },
    });
  };

  return (
    <>
      <Button onClick={handleClick}>show Test Modal</Button>
      {TestModal}
      {JSON.stringify(TestModal !== null)}
    </>
  );
}
