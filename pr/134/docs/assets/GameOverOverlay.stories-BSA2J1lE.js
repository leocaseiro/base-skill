import{j as u}from"./iframe-Bh2nVCMs.js";import{G as o}from"./GameOverOverlay-BC-N_Khr.js";import"./preload-helper-PPVm8Dsz.js";import"./confetti.module-oQXWb4Lk.js";const{expect:c,fn:i,userEvent:l,waitFor:m,within:p}=__STORYBOOK_MODULE_TEST__,y=a=>a>=5?0:a===4?1:a===3?3:a===2?5:7,f={component:o,title:"answer-game/GameOverOverlay",tags:["autodocs"],args:{stars:5,onPlayAgain:i(),onHome:i()},argTypes:{stars:{control:{type:"range",min:1,max:5,step:1}},onPlayAgain:{table:{disable:!0}},onHome:{table:{disable:!0}}},render:({stars:a,onPlayAgain:e,onHome:n})=>u.jsx(o,{retryCount:y(a),onPlayAgain:e,onHome:n})},t={},r={args:{stars:5},play:async({args:a,canvasElement:e})=>{const n=p(e);await l.click(await n.findByRole("button",{name:/play again/i})),await m(()=>{c(a.onPlayAgain).toHaveBeenCalledTimes(1)})}},s={args:{stars:5},play:async({args:a,canvasElement:e})=>{const n=p(e);await l.click(await n.findByRole("button",{name:/home/i})),await m(()=>{c(a.onHome).toHaveBeenCalledTimes(1)})}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:"{}",...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    stars: 5
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
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    stars: 5
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
}`,...s.parameters?.docs?.source}}};const E=["Playground","ClicksPlayAgain","ClicksHome"];export{s as ClicksHome,r as ClicksPlayAgain,t as Playground,E as __namedExportsOrder,f as default};
