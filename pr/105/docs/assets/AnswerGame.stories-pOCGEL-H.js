import{j as e}from"./iframe-2OVB56Q-.js";import{w as m}from"./withDb-DH1Pt8SY.js";import{A as r}from"./AnswerGame-O2qGDs-1.js";import{A as i}from"./AudioButton-B2GEy-aI.js";import{I as c}from"./ImageQuestion-KkujB3d0.js";import{T as p}from"./TextQuestion-DbiUa8X0.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-C4zsb6kA.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./AnswerGameProvider-S4jdPm92.js";import"./AudioFeedback-DxUgBcwr.js";import"./game-event-bus-CVIPXPct.js";import"./ProgressHUD-CcsIM324.js";import"./useGameTTS-CzVif3lP.js";import"./useSettings-BmdWAG_X.js";import"./useRxDB-BOaLPnhc.js";import"./useRxQuery-D0oNpHCd.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-gc6_NG_E.js";import"./index-B7oOw7Jn.js";import"./index-B3BZJZKS.js";import"./createLucideIcon-BVjdCZOl.js";const a={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:3,ttsEnabled:!0},L={component:r,tags:["autodocs"],args:{config:a},decorators:[m]},o={render:d=>e.jsxs(r,{...d,children:[e.jsxs(r.Question,{children:[e.jsx(c,{src:"https://placehold.co/160",prompt:"cat"}),e.jsx(i,{prompt:"cat"})]}),e.jsx(r.Answer,{children:e.jsx("div",{className:"flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground",children:"Answer slots here"})}),e.jsx(r.Choices,{children:e.jsx("div",{className:"flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground",children:"Tile bank here"})})]})},s={args:{config:{...a,inputMethod:"type"}},render:d=>e.jsxs(r,{...d,children:[e.jsxs(r.Question,{children:[e.jsx(p,{text:"three"}),e.jsx(i,{prompt:"three"})]}),e.jsx(r.Answer,{children:e.jsx("div",{className:"flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground",children:"Typed slots here"})})]})},t={args:{config:{...a,wrongTileBehavior:"reject"}},render:o.render},n={args:{config:{...a,wrongTileBehavior:"lock-manual"}},render:o.render};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: args => <AnswerGame {...args}>
      <AnswerGame.Question>
        <ImageQuestion src="https://placehold.co/160" prompt="cat" />
        <AudioButton prompt="cat" />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <div className="flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground">
          Answer slots here
        </div>
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <div className="flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground">
          Tile bank here
        </div>
      </AnswerGame.Choices>
    </AnswerGame>
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      inputMethod: 'type'
    }
  },
  render: args => <AnswerGame {...args}>
      <AnswerGame.Question>
        <TextQuestion text="three" />
        <AudioButton prompt="three" />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <div className="flex gap-2 rounded-lg border-2 border-dashed p-4 text-muted-foreground">
          Typed slots here
        </div>
      </AnswerGame.Answer>
    </AnswerGame>
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'reject'
    }
  },
  render: Default.render
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual'
    }
  },
  render: Default.render
}`,...n.parameters?.docs?.source}}};const _=["Default","TextQuestionMode","RejectMode","LockManualMode"];export{o as Default,n as LockManualMode,t as RejectMode,s as TextQuestionMode,_ as __namedExportsOrder,L as default};
