import { type ReactNode, useState } from 'react';

interface IPayloadBase {
  visible: boolean;
  [key: string]: any;
}

type IRenderDialog<P extends IPayloadBase> = {
  payload: P;
  setPayload: (payload: Partial<P>) => void;
};

type DialogHookResult<N extends string, P> = Record<N, ReactNode> &
  Record<`show${N}`, (payload: Omit<P, 'visible'>) => void> &
  Record<`hide${N}`, () => void>;

export function generateSingleDialogHook<N extends string, P extends IPayloadBase>(
  name: N,
  renderDialog: (params: IRenderDialog<P>) => ReactNode,
) {
  let showDialog: (payload: Omit<P, 'visible'>) => void = () => {};
  let hideDialog: () => void = () => {};

  return (mount?: boolean) => {
    const [payload, setPayload] = useState<IPayloadBase>({ visible: false });

    if (mount) {
      showDialog = (next: Omit<P, 'visible'>) => {
        setPayload((prev) => ({ ...prev, ...next, visible: true }));
      };
      hideDialog = () => {
        setPayload({ visible: false });
      };
    }

    return {
      [`show${name}`]: showDialog,
      [`hide${name}`]: hideDialog,
      [name]: mount ? renderDialog({ payload, setPayload } as any) : null,
    } as DialogHookResult<N, P>;
  };
}
