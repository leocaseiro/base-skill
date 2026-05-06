import{j as e}from"./iframe-BrZ49dTy.js";import{A as y,E as u,a as c,b as k,t as b,S,s as v,g as w}from"./sprites-B49x4jZz.js";import"./preload-helper-PPVm8Dsz.js";const A=({source:o,frameIndex:m,displayWidth:d,displayHeight:p,backgroundColor:f,showBorder:g,borderColor:r})=>{const a=o==="egg"?u:c,t=Math.min(Math.max(0,m),a-1),h=w(o),s=b(h);return e.jsxs("div",{className:"flex min-h-screen flex-col items-center justify-center gap-4 p-8",style:{backgroundColor:f},children:[e.jsx("div",{style:{outline:g?`2px dashed ${r}`:"none",outlineOffset:"0px"},children:e.jsx("div",{style:s?{transform:s}:void 0,children:e.jsx(S,{src:v(o),totalFrames:a,frameIndex:t,displayWidth:d,displayHeight:p,alt:`${o} frame ${t.toString()}`})})}),e.jsxs("div",{className:"rounded bg-white/90 px-3 py-1 font-mono text-sm text-black",children:[o," · frame ",t.toString()," / ",a-1,s?` · ${s}`:""]})]})},j={component:A,title:"MiniGames/DinoEggHatch/SpriteInspector",tags:["autodocs"],parameters:{docs:{description:{component:"Asset QA tool — pick any sprite and frame, toggle the boundary box, and try background colors to spot bleed from neighbouring frames or transparent edges that disappear against certain backgrounds."}}},argTypes:{source:{control:{type:"select"},options:["egg",...y]},frameIndex:{control:{type:"range",min:0,max:c-1,step:1}},displayWidth:{control:{type:"range",min:120,max:600,step:20}},displayHeight:{control:{type:"range",min:120,max:700,step:20}},backgroundColor:{control:{type:"color"}},borderColor:{control:{type:"color"}},showBorder:{control:{type:"boolean"}}},args:{source:"owl",frameIndex:3,displayWidth:240,displayHeight:268,backgroundColor:"#7e48c0",showBorder:!0,borderColor:"#ff00ff"}},i={},l={argTypes:{backgroundColor:{control:{type:"color"}},borderColor:{control:{type:"color"}},showBorder:{control:{type:"boolean"}},cellWidth:{control:{type:"range",min:80,max:320,step:20}},cellHeight:{control:{type:"range",min:90,max:360,step:20}}},args:{backgroundColor:"#7e48c0",showBorder:!0,borderColor:"#ff00ff",cellWidth:160,cellHeight:178},render:({backgroundColor:o,showBorder:m,borderColor:d,cellWidth:p,cellHeight:f})=>{const g=[{key:"egg",label:"Egg (intact — reference)",framesInStrip:u,framesToShow:1},...y.map(r=>({key:r,label:k[r].name,framesInStrip:c,framesToShow:c}))];return e.jsx("div",{className:"min-h-screen p-6",style:{backgroundColor:o},children:e.jsx("div",{className:"flex flex-col gap-6",children:g.map(({key:r,label:a,framesInStrip:t,framesToShow:h})=>e.jsxs("div",{className:"flex flex-col gap-2",children:[e.jsxs("div",{className:"font-mono text-sm font-bold text-white",children:[a," ",e.jsxs("span",{className:"text-sm font-normal",children:["(",r," · ",t.toString()," frames)"]})]}),e.jsx("div",{className:"flex flex-wrap gap-3",children:Array.from({length:h},(s,n)=>{const x=b(w(r));return e.jsxs("div",{className:"flex flex-col items-center gap-1",children:[e.jsx("div",{style:{outline:m?`2px dashed ${d}`:"none"},children:e.jsx("div",{style:x?{transform:x}:void 0,children:e.jsx(S,{src:v(r),totalFrames:t,frameIndex:n,displayWidth:p,displayHeight:f,alt:`${r} frame ${n.toString()}`})})}),e.jsxs("div",{className:"font-mono text-xs text-white",children:["frame ",n]})]},n)})})]},r))})})}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:"{}",...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  argTypes: {
    backgroundColor: {
      control: {
        type: 'color'
      }
    },
    borderColor: {
      control: {
        type: 'color'
      }
    },
    showBorder: {
      control: {
        type: 'boolean'
      }
    },
    cellWidth: {
      control: {
        type: 'range',
        min: 80,
        max: 320,
        step: 20
      }
    },
    cellHeight: {
      control: {
        type: 'range',
        min: 90,
        max: 360,
        step: 20
      }
    }
  },
  args: {
    backgroundColor: '#7e48c0',
    showBorder: true,
    borderColor: '#ff00ff',
    cellWidth: 160,
    cellHeight: 178
  },
  render: ({
    backgroundColor,
    showBorder,
    borderColor,
    cellWidth,
    cellHeight
  }) => {
    // Egg is shown as a reference card with only its intact frame (no
    // cracks) so it sits at the top of the grid as a visual baseline for
    // animal sizes. \`framesInStrip\` is the strip's real frame count
    // (passed to SpriteFrame for correct background-position math);
    // \`framesToShow\` controls how many cells we actually render.
    const sources: Array<{
      key: Animal | 'egg';
      label: string;
      framesInStrip: number;
      framesToShow: number;
    }> = [{
      key: 'egg',
      label: 'Egg (intact — reference)',
      framesInStrip: EGG_FRAMES,
      framesToShow: 1
    }, ...ANIMAL_KEYS.map(key => ({
      key,
      label: ANIMALS[key].name,
      framesInStrip: ANIMAL_FRAMES,
      framesToShow: ANIMAL_FRAMES
    }))];
    return <div className="min-h-screen p-6" style={{
      backgroundColor
    }}>
        <div className="flex flex-col gap-6">
          {sources.map(({
          key,
          label,
          framesInStrip,
          framesToShow
        }) => <div key={key} className="flex flex-col gap-2">
                <div className="font-mono text-sm font-bold text-white">
                  {label}{' '}
                  <span className="text-sm font-normal">
                    ({key} · {framesInStrip.toString()} frames)
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Array.from({
              length: framesToShow
            }, (_, i) => {
              const cellTransform = tweakToTransform(getDisplayTweak(key));
              return <div key={i} className="flex flex-col items-center gap-1">
                        <div style={{
                  outline: showBorder ? \`2px dashed \${borderColor}\` : 'none'
                }}>
                          <div style={cellTransform ? {
                    transform: cellTransform
                  } : undefined}>
                            <SpriteFrame src={stripUrl(key)} totalFrames={framesInStrip} frameIndex={i} displayWidth={cellWidth} displayHeight={cellHeight} alt={\`\${key} frame \${i.toString()}\`} />
                          </div>
                        </div>
                        <div className="font-mono text-xs text-white">
                          frame {i}
                        </div>
                      </div>;
            })}
                </div>
              </div>)}
        </div>
      </div>;
  }
}`,...l.parameters?.docs?.source},description:{story:`Grid that lays out every frame of every sprite in the catalog. Use this
to scan all assets at once for cropping, alignment drift, or transparent
edges — the boundary outline makes frame-bleed instantly visible.`,...l.parameters?.docs?.description}}};const F=["SingleFrame","AllFrames"];export{l as AllFrames,i as SingleFrame,F as __namedExportsOrder,j as default};
