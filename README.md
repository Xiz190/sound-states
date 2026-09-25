# Sound States

**Your state is the input; the structure of the sound is the output.**

**Live site → https://xiz190.github.io/sound-states/**

Sound States is a web prototype for music that follows the body. You choose where you want to be — relax, imagine, move, work, sleep — and your heart rate, read against your own resting baseline, shapes how the sound takes you there by changing its *structure*: which instrument layers play, how open the sound is, how near or far it sits. Not its volume.

It is built around three questions:

- **What should change?** Melody makes the brain predict the next note, and a predicting brain can't rest (Huron, 2006). So the non-melodic states (Work, Sleep) are synthesised live in code, and the melodic ones keep their melody while the layers around it move.
- **How should it change?** Arousal from heart rate opens a low-pass filter and moves stem layers in and out. Directions come from theory (Russell, 1980; Juslin, 2013); the amounts are design choices.
- **Who decides?** Heart rate measures arousal, not intention. You choose the state; if you're tense or low, you pick a strategy (Saarikallio & Erkkilä, 2007; Saarikallio, 2008). You can always take over by hand.

## Try it
- Open the live site and press **Begin**. Hover the disc, then click a state.
- No sensor? Choose **Demo · no sensor** in the player and drag the heart-rate slider.
- Headphones recommended.

## Look inside
From the About page, or directly:
- [Interactive system model](https://xiz190.github.io/sound-states/model-diagram.html) — a state mapped to sound in real time
- [Stems, on one board](https://xiz190.github.io/sound-states/stem-test.html) — hear layers enter and leave with arousal
- [Spatial orchestration](https://xiz190.github.io/sound-states/scene.html) — sources placed by psychoacoustic cues
- [Synthesis engine](https://xiz190.github.io/sound-states/sound-library.html) — the generative layers, built in code
- [From mirror to guide](https://xiz190.github.io/sound-states/vision-page.html) — where this is headed

## How it's made
- Plain HTML / CSS / JavaScript and the Web Audio API; no build step.
- Heart rate: MAX30102 optical sensor on an Arduino Nano over Web Serial (desktop Chrome / Edge).
- Tracks: generated with AI from my prompts and refined over several rounds, then selected, remixed and split into stems by me. The system design is mine.
- Soundscape sources: AI-generated ambient recordings, cut and levelled for looping; all spatialisation, filtering and timing happen live in the browser.

## Limits
A design prototype, not a verified intervention. No therapeutic effect is claimed. Mapping amounts are designed, not calibrated; the sleep arc runs a fixed 120 seconds for everyone.

---

**中文简介**：Sound States 是一个"让音乐跟着身体走"的网页原型。你选择想去的状态，心率（相对你自己的静息基线）决定声音怎么带你过去——改变的是声音的**结构**（哪些声部在响、有多通透、离你多近），不是音量。曲目由 AI 按作者的关键词生成、迭代，再由作者筛选、重混、拆分轨；系统设计由作者完成。这是设计原型，不声称疗效。
