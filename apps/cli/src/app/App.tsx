import React, { useLayoutEffect, useState } from 'react';
import { Box, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { useScreenSize } from './hooks/useScreenSize';

export const App: React.FC = React.memo(() => {
  const [text, setText] = useState('');
  const { height, width } = useScreenSize();
  const { stdout } = useStdout();

  useLayoutEffect(() => {
    stdout?.write('\x1b[?1049h');

    return () => {
      stdout?.write('\x1b[?1049l');
    };
  }, [stdout]);

  return (
    <Box
      height={height}
      width={width}
      borderStyle="round"
      borderColor="green"
      flexDirection="column"
    >
      <Box>
        <TextInput value={text} onChange={setText} />
      </Box>

      {/* ink-tab removed: its React-17-era types reject children under React 18,
          and this app view was never finished upstream */}
    </Box>
  );
});
App.displayName = 'App';
