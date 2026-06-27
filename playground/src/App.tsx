import { Button } from 'antd';
import { AppContext } from './AppContext';
import { useTestModal } from './useTestModal';

export function App() {
  const { showTestModal, TestModal } = useTestModal(true);

  const handleClick = () => {
    showTestModal({
      success: async (values) => {
        console.log(values);
      },
    });
  };

  return (
    <AppContext.Provider value={{ name: 'JiangWei' }}>
      <Button onClick={handleClick}>show Test Modal</Button>
      {TestModal}
    </AppContext.Provider>
  );
}
