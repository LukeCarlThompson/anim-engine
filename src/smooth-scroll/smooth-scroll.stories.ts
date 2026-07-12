import type { Meta, StoryObj } from "@storybook/html-vite";

import { getTicker } from "../ticker";
import { createSmoothScroll } from "./create-smooth-scroll";

getTicker().start();

const meta = {
  title: "Smooth scroll",
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const container = document.createElement("div");
    container.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px;font-family:sans-serif;";

    const title = document.createElement("h2");
    title.textContent = "Smooth Scroll — block drag";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const desc = document.createElement("p");
    desc.textContent = "Drag the block — coast distance is controlled by smoothTimeMs";
    desc.style.cssText = "margin:0;color:#666;font-size:13px;";
    container.appendChild(desc);

    const track = document.createElement("div");
    track.style.cssText =
      "position:relative;width:700px;height:150px;background:#2a2a3d;border-radius:8px;cursor:grab;user-select:none;";

    const boundL = document.createElement("div");
    boundL.style.cssText =
      "position:absolute;top:0;bottom:0;left:0;width:2px;background:#e06c75;pointer-events:none;opacity:0.5;";
    track.appendChild(boundL);
    const boundR = document.createElement("div");
    boundR.style.cssText =
      "position:absolute;top:0;bottom:0;left:650px;width:2px;background:#e06c75;pointer-events:none;opacity:0.5;";
    track.appendChild(boundR);

    const block = document.createElement("div");
    block.style.cssText =
      "position:absolute;top:50%;width:50px;height:50px;border-radius:8px;background:linear-gradient(135deg,#61afef,#528bff);pointer-events:none;cursor:grab;";
    block.style.transform = "translateY(-50%)";
    track.appendChild(block);
    container.appendChild(track);

    const velRow = document.createElement("div");
    velRow.style.cssText =
      "display:flex;align-items:center;gap:12px;width:700px;font-size:13px;color:#888;font-family:monospace;";
    const vl = document.createElement("span");
    vl.textContent = "velocity";
    vl.style.cssText = "min-width:60px;color:#666;";
    const vv = document.createElement("span");
    vv.textContent = "0.00";
    vv.style.cssText = "min-width:60px;text-align:right;color:#61afef;";
    velRow.appendChild(vl);
    velRow.appendChild(vv);
    container.appendChild(velRow);

    let currentSmoothTimeMs = 80;

    const scroll = createSmoothScroll({
      smoothTimeMs: () => currentSmoothTimeMs,
      min: 0,
      max: 650,
      precision: 0.5,
      onUpdate: (value, velocity) => {
        block.style.left = `${value}px`;
        vv.textContent = velocity.toFixed(2);
      },
    });

    let lastX = 0;
    const handlePointerDown = (e: PointerEvent) => {
      lastX = e.clientX;
      scroll.setValue(scroll.value);
      track.setPointerCapture(e.pointerId);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons === 0) return;
      scroll.addDelta(e.clientX - lastX);
      lastX = e.clientX;
    };
    track.addEventListener("pointerdown", handlePointerDown);
    track.addEventListener("pointermove", handlePointerMove);

    // Smooth time slider
    const sliderRow = document.createElement("div");
    sliderRow.style.cssText =
      "display:flex;align-items:center;gap:8px;width:700px;font-size:12px;color:#888;font-family:monospace;";
    const sl = document.createElement("span");
    sl.textContent = "smoothTimeMs";
    sl.style.cssText = "min-width:110px;";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "10";
    slider.max = "500";
    slider.step = "10";
    slider.value = "80";
    slider.style.cssText = "accent-color:#61afef;width:200px;";
    const sv = document.createElement("span");
    sv.textContent = "80";
    sv.style.cssText = "min-width:30px;color:#61afef;";
    slider.addEventListener("input", () => {
      currentSmoothTimeMs = Number(slider.value);
      sv.textContent = slider.value;
    });
    sliderRow.appendChild(sl);
    sliderRow.appendChild(slider);
    sliderRow.appendChild(sv);
    container.appendChild(sliderRow);

    return container;
  },
};

// ─── Horizontal scroll ───────────────────────────────────────
export const HorizontalScroll: Story = {
  render: () => {
    const container = document.createElement("div");
    container.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px;font-family:sans-serif;";
    const title = document.createElement("h2");
    title.textContent = "Horizontal Scroll";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const viewport = document.createElement("div");
    viewport.style.cssText =
      "width:700px;height:200px;overflow:hidden;background:#2a2a3d;border-radius:8px;cursor:grab;position:relative;user-select:none;";
    const track = document.createElement("div");
    track.style.cssText =
      "position:absolute;top:0;left:0;height:100%;display:flex;align-items:center;gap:16px;padding:0 40px;pointer-events:none;";

    const colors = ["#e06c75", "#61afef", "#98c379", "#c678dd", "#56b6c2", "#d19a66"];
    const labels = [
      "Photos",
      "Videos",
      "Music",
      "Docs",
      "Settings",
      "Downloads",
      "Favorites",
      "Recents",
    ];
    for (let i = 0; i < 8; i++) {
      const item = document.createElement("div");
      item.style.cssText = `width:120px;height:140px;border-radius:10px;background:${colors[i % 6]}33;border:1px solid ${colors[i % 6]}66;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;flex-shrink:0;`;
      const icon = document.createElement("div");
      icon.style.cssText = `width:40px;height:40px;border-radius:8px;background:${colors[i % 6]};`;
      item.appendChild(icon);
      const label = document.createElement("span");
      label.textContent = labels[i];
      label.style.cssText = "color:#ccc;font-size:12px;";
      item.appendChild(label);
      track.appendChild(item);
    }

    const maxScroll = 80 + 8 * 120 + 7 * 16 - 700;
    viewport.appendChild(track);
    container.appendChild(viewport);

    let currentSmoothTimeMs = 30;

    const scroll = createSmoothScroll({
      smoothTimeMs: () => currentSmoothTimeMs,
      min: 0,
      max: maxScroll,
      precision: 0.5,
      onUpdate: (v) => {
        track.style.transform = `translateX(${-v}px)`;
      },
    });

    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        scroll.addDelta(e.deltaX || e.deltaY);
      },
      { passive: false },
    );

    let lastX = 0;
    const handlePointerDown = (e: PointerEvent) => {
      lastX = e.clientX;
      scroll.setValue(scroll.value);
      viewport.setPointerCapture(e.pointerId);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons === 0) return;
      scroll.addDelta(-(e.clientX - lastX));
      lastX = e.clientX;
    };
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);

    // Smooth time slider
    const sliderRow = document.createElement("div");
    sliderRow.style.cssText =
      "display:flex;align-items:center;gap:8px;width:700px;font-size:12px;color:#888;font-family:monospace;";
    const sl = document.createElement("span");
    sl.textContent = "smoothTimeMs";
    sl.style.cssText = "min-width:110px;";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "10";
    slider.max = "500";
    slider.step = "10";
    slider.value = "30";
    slider.style.cssText = "accent-color:#61afef;width:200px;";
    const sv = document.createElement("span");
    sv.textContent = "30";
    sv.style.cssText = "min-width:30px;color:#61afef;";
    slider.addEventListener("input", () => {
      currentSmoothTimeMs = Number(slider.value);
      sv.textContent = slider.value;
    });
    sliderRow.appendChild(sl);
    sliderRow.appendChild(slider);
    sliderRow.appendChild(sv);
    container.appendChild(sliderRow);

    return container;
  },
};

// ─── Vertical scroll ─────────────────────────────────────────
export const VerticalScroll: Story = {
  render: () => {
    const container = document.createElement("div");
    container.style.cssText =
      "display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px;font-family:sans-serif;";
    const title = document.createElement("h2");
    title.textContent = "Vertical Scroll";
    title.style.cssText = "margin:0;color:#ccc;font-weight:400;font-size:18px;";
    container.appendChild(title);

    const viewport = document.createElement("div");
    viewport.style.cssText =
      "width:400px;height:350px;overflow:hidden;background:#2a2a3d;border-radius:8px;cursor:grab;position:relative;user-select:none;";
    const track = document.createElement("div");
    track.style.cssText = "position:absolute;top:0;left:0;width:100%;pointer-events:none;";

    const names = [
      "Alice Johnson",
      "Bob Smith",
      "Carol Davis",
      "David Wilson",
      "Eve Martinez",
      "Frank Lee",
      "Grace Kim",
      "Henry Brown",
      "Iris Chen",
      "Jack Taylor",
      "Kate White",
      "Leo Garcia",
      "Mia Robinson",
      "Noah Clark",
      "Olivia Lewis",
      "Paul Hall",
      "Quinn Young",
      "Rachel King",
      "Sam Wright",
      "Tina Lopez",
      "Uma Scott",
      "Victor Adams",
      "Wendy Baker",
      "Xander Hill",
      "Yara Green",
      "Zack Nelson",
    ];
    const avatars = ["#e06c75", "#61afef", "#98c379", "#c678dd", "#56b6c2", "#d19a66"];
    for (let i = 0; i < names.length; i++) {
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #ffffff0a;";
      const avatar = document.createElement("div");
      avatar.style.cssText = `width:36px;height:36px;border-radius:50%;background:${avatars[i % 6]};flex-shrink:0;`;
      row.appendChild(avatar);
      const text = document.createElement("div");
      text.style.cssText = "display:flex;flex-direction:column;gap:2px;";
      const name = document.createElement("span");
      name.textContent = names[i];
      name.style.cssText = "color:#ccc;font-size:14px;";
      text.appendChild(name);
      const status = document.createElement("span");
      status.textContent = i % 3 === 0 ? "Online" : i % 3 === 1 ? "Away" : "Offline";
      status.style.cssText = `font-size:11px;color:${i % 3 === 0 ? "#98c379" : i % 3 === 1 ? "#d19a66" : "#666"};`;
      text.appendChild(status);
      row.appendChild(text);
      track.appendChild(row);
    }

    const maxScroll = Math.max(0, names.length * 61 - 350);
    viewport.appendChild(track);
    container.appendChild(viewport);

    let currentSmoothTimeMs = 30;

    const scroll = createSmoothScroll({
      smoothTimeMs: () => currentSmoothTimeMs,
      min: 0,
      max: maxScroll,
      precision: 0.5,
      onUpdate: (v) => {
        track.style.transform = `translateY(${-v}px)`;
      },
    });

    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        scroll.addDelta(e.deltaY * (e.deltaMode === 1 ? 20 : 1));
      },
      { passive: false },
    );

    let lastY = 0;
    const handlePointerDown = (e: PointerEvent) => {
      lastY = e.clientY;
      scroll.setValue(scroll.value);
      viewport.setPointerCapture(e.pointerId);
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons === 0) return;
      scroll.addDelta(-(e.clientY - lastY));
      lastY = e.clientY;
    };
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);

    // Smooth time slider
    const sliderRow = document.createElement("div");
    sliderRow.style.cssText =
      "display:flex;align-items:center;gap:8px;width:400px;font-size:12px;color:#888;font-family:monospace;";
    const sl = document.createElement("span");
    sl.textContent = "smoothTimeMs";
    sl.style.cssText = "min-width:110px;";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "10";
    slider.max = "500";
    slider.step = "10";
    slider.value = "30";
    slider.style.cssText = "accent-color:#61afef;width:200px;";
    const sv = document.createElement("span");
    sv.textContent = "30";
    sv.style.cssText = "min-width:30px;color:#61afef;";
    slider.addEventListener("input", () => {
      currentSmoothTimeMs = Number(slider.value);
      sv.textContent = slider.value;
    });
    sliderRow.appendChild(sl);
    sliderRow.appendChild(slider);
    sliderRow.appendChild(sv);
    container.appendChild(sliderRow);

    return container;
  },
};
