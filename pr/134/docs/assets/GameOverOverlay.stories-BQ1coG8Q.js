import{G as d}from"./GameOverOverlay-MMjs6fZL.js";import"./iframe-Dfo1a1-D.js";import"./preload-helper-PPVm8Dsz.js";import"./confetti.module-oQXWb4Lk.js";const{expect:u,fn:l,userEvent:p,waitFor:y,within:g}=__STORYBOOK_MODULE_TEST__,T={component:d,title:"answer-game/GameOverOverlay",tags:["autodocs"],args:{retryCount:0,onPlayAgain:l(),onHome:l()},argTypes:{retryCount:{control:{type:"range",min:0,max:10,step:1}},onPlayAgain:{table:{disable:!0}},onHome:{table:{disable:!0}}}},a={args:{retryCount:0}},e={args:{retryCount:1}},r={args:{retryCount:3}},n={args:{retryCount:5}},t={args:{retryCount:8}},s={args:{retryCount:0},play:async({args:c,canvasElement:i})=>{const m=g(i);await p.click(await m.findByRole("button",{name:/play again/i})),await y(()=>{u(c.onPlayAgain).toHaveBeenCalledTimes(1)})}},o={args:{retryCount:0},play:async({args:c,canvasElement:i})=>{const m=g(i);await p.click(await m.findByRole("button",{name:/home/i})),await y(()=>{u(c.onHome).toHaveBeenCalledTimes(1)})}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    retryCount: 0
  }
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    retryCount: 1
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    retryCount: 3
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    retryCount: 5
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    retryCount: 8
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    retryCount: 0
  },
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', {
      name: /play again/i
    }));
    await waitFor(() => {
      expect(args.onPlayAgain).toHaveBeenCalledTimes(1);
    });
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    retryCount: 0
  },
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', {
      name: /home/i
    }));
    await waitFor(() => {
      expect(args.onHome).toHaveBeenCalledTimes(1);
    });
  }
}`,...o.parameters?.docs?.source}}};const O=["FiveStars","FourStars","ThreeStars","TwoStars","OneStar","ClicksPlayAgain","ClicksHome"];export{o as ClicksHome,s as ClicksPlayAgain,a as FiveStars,e as FourStars,t as OneStar,r as ThreeStars,n as TwoStars,O as __namedExportsOrder,T as default};
