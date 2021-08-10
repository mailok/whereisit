import React, { createContext, FC, useContext, useMemo } from 'react';

type IfContextProps = {
  cond?: boolean;
};

const IfContext = createContext<IfContextProps>({});
const useIf = () => useContext(IfContext);

interface IfProps extends IfContextProps {}

export const If: FC<IfProps> = (props) => {
  return (
    <IfContext.Provider value={{ cond: props.cond }}>
      <>{props.children}</>
    </IfContext.Provider>
  );
};

export const Then: FC = (props) => {
  const { cond } = useIf();
  return cond ? <>{props.children}</> : <></>;
};

interface ElseProps {
  if?: IfContextProps['cond'];
}

export const Else: FC<ElseProps> = (props) => {
  const { cond } = useIf();
  if (cond) return null;
  if (props.if !== undefined) {
    return props.if ? <>{props.children}</> : <></>;
  }
  return <>{props.children}</>;
};
