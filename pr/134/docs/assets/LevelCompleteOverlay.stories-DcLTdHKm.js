import{L as d}from"./LevelCompleteOverlay-D15R0BHC.js";import"./iframe-Dfo1a1-D.js";import"./preload-helper-PPVm8Dsz.js";import"./confetti.module-oQXWb4Lk.js";const{expect:i,fn:c,userEvent:v,waitFor:m,within:p}=__STORYBOOK_MODULE_TEST__,L={component:d,title:"answer-game/LevelCompleteOverlay",tags:["autodocs"],args:{level:1,onNextLevel:c(),onDone:c()},argTypes:{level:{control:{type:"range",min:1,max:20,step:1}},onNextLevel:{table:{disable:!0}},onDone:{table:{disable:!0}}}},e={args:{level:1}},a={args:{level:3}},n={args:{level:10}},s={args:{level:1},play:async({args:r,canvasElement:o})=>{const l=p(o);await v.click(await l.findByRole("button",{name:/next level/i})),await m(()=>{i(r.onNextLevel).toHaveBeenCalledTimes(1)})}},t={args:{level:1},play:async({args:r,canvasElement:o})=>{const l=p(o);await v.click(await l.findByRole("button",{name:/done/i})),await m(()=>{i(r.onDone).toHaveBeenCalledTimes(1)})}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    level: 1
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    level: 3
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    level: 10
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    level: 1
  },
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', {
      name: /next level/i
    }));
    await waitFor(() => {
      expect(args.onNextLevel).toHaveBeenCalledTimes(1);
    });
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    level: 1
  },
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', {
      name: /done/i
    }));
    await waitFor(() => {
      expect(args.onDone).toHaveBeenCalledTimes(1);
    });
  }
}`,...t.parameters?.docs?.source}}};const x=["Level1","Level3","Level10","ClicksNextLevel","ClicksDone"];export{t as ClicksDone,s as ClicksNextLevel,e as Level1,n as Level10,a as Level3,x as __namedExportsOrder,L as default};
