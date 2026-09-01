import { regPluginGroupConfigItem } from '@capital/common';
import { TextArea } from '@capital/component';
import React, { useEffect, useState } from 'react';
import { Translate } from './translate';

console.log('Plugin Group Welcome is loaded');

regPluginGroupConfigItem({
  name: 'groupWelcomeText',
  title: Translate.welcomeText,
  tip: Translate.welcomeTip,
  component: ({ value, onChange, loading }) => {
    const [text, setText] = useState(value ?? '');

    useEffect(() => {
      setText(value ?? '');
    }, [value]);

    return (
      <div className="w-full min-w-0 space-y-2 sm:min-w-96 sm:max-w-xl">
        <TextArea
          aria-label={Translate.welcomeText}
          className="min-h-32 resize-y"
          disabled={loading}
          value={text}
          maxLength={2000}
          showCount={true}
          rows={5}
          placeholder={Translate.welcomePlaceholder}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => onChange(text)}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {Translate.welcomeDesc}
        </p>
      </div>
    );
  },
});
