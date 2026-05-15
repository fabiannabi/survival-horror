import { Application, Graphics, Container, Text } from 'pixi.js';
import type { ZoneState } from '../engine/world/Zone';
import { FogOfWar } from '../engine/world/FogOfWar';

type ClickHandler = (zoneId: string) => void;

const PADDING = 60;
const BLOCK_SIZE = 20; // city grid cell size (px)

const ZONE_COLORS: Record<string, number> = {
  residential: 0x4a6e3a,
  commercial:  0x3a5070,
  industrial:  0x6e4a2a,
  medical:     0x2a7060,
  military:    0x6e2a2a,
  wild:        0x2a5a2a,
};

const ZONE_ICONS: Record<string, string> = {
  residential: 'RES',
  commercial:  'COM',
  industrial:  'IND',
  medical:     'MED',
  military:    'MIL',
  wild:        'NAT',
};

export class StrategicView {
  private bgLayer    = new Container();
  private areaLayer  = new Container();
  private connLayer  = new Container();
  private zoneLayer  = new Container();

  constructor(private app: Application) {
    this.app.stage.addChild(this.bgLayer);
    this.app.stage.addChild(this.areaLayer);
    this.app.stage.addChild(this.connLayer);
    this.app.stage.addChild(this.zoneLayer);
  }

  render(
    zones: ZoneState[],
    currentZoneId: string,
    selectedZoneId: string | null,
    onClick: ClickHandler,
    selectionMode = false,
  ): void {
    this.bgLayer.removeChildren();
    this.areaLayer.removeChildren();
    this.connLayer.removeChildren();
    this.zoneLayer.removeChildren();

    const { width, height } = this.app.screen;
    const pw = width  - PADDING * 2;
    const ph = height - PADDING * 2;
    const tx = (nx: number) => PADDING + nx * pw;
    const ty = (ny: number) => PADDING + ny * ph;

    this.drawBackground(width, height);

    // Roads between visible zones
    for (const zone of zones) {
      const visible = selectionMode || FogOfWar.isVisible(zone.fog);
      if (!visible) continue;
      for (const connId of zone.connections) {
        if (connId > zone.id) continue;
        const conn = zones.find((z) => z.id === connId);
        if (!conn) continue;
        const connVisible = selectionMode || FogOfWar.isVisible(conn.fog);
        if (!connVisible) continue;
        this.drawRoad(tx(zone.position.x), ty(zone.position.y), tx(conn.position.x), ty(conn.position.y));
      }
    }

    // Zone territory blobs + markers
    for (const zone of zones) {
      const visible = selectionMode || FogOfWar.isVisible(zone.fog);
      if (!visible && !selectionMode) {
        // Draw faint "unknown" indicator
        this.drawUnknownMarker(tx(zone.position.x), ty(zone.position.y));
        continue;
      }

      const fogAlpha = selectionMode ? 1 : FogOfWar.alpha(zone.fog);
      this.drawZoneArea(zone, tx(zone.position.x), ty(zone.position.y), fogAlpha);
    }

    // Zone markers (on top)
    for (const zone of zones) {
      const visible = selectionMode || FogOfWar.isVisible(zone.fog);
      if (!visible) continue;

      const fogAlpha = selectionMode ? 1 : FogOfWar.alpha(zone.fog);
      const node = this.buildMarker(zone, currentZoneId, selectedZoneId, fogAlpha, selectionMode);
      node.x = tx(zone.position.x);
      node.y = ty(zone.position.y);
      node.eventMode = 'static';
      node.cursor = 'pointer';
      node.on('pointerdown', () => onClick(zone.id));
      this.zoneLayer.addChild(node);
    }
  }

  // ─── Background: city grid ────────────────────────────────────────────
  private drawBackground(w: number, h: number): void {
    const base = new Graphics();
    base.rect(0, 0, w, h);
    base.fill({ color: 0x0d0d0c });
    this.bgLayer.addChild(base);

    // Minor street grid
    const grid = new Graphics();
    for (let x = 0; x <= w; x += BLOCK_SIZE) {
      grid.moveTo(x, 0); grid.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += BLOCK_SIZE) {
      grid.moveTo(0, y); grid.lineTo(w, y);
    }
    grid.stroke({ color: 0x161614, width: 1 });
    this.bgLayer.addChild(grid);

    // City name watermark
    const watermark = new Text({
      text: 'AGUASCALIENTES',
      style: {
        fill: 0x1e1e1a,
        fontSize: 28,
        fontFamily: 'Barlow Condensed, sans-serif',
        letterSpacing: 6,
        fontWeight: '700',
      },
    });
    watermark.anchor.set(0.5);
    watermark.x = w / 2;
    watermark.y = h / 2;
    this.bgLayer.addChild(watermark);
  }

  // ─── Road ─────────────────────────────────────────────────────────────
  private drawRoad(x1: number, y1: number, x2: number, y2: number): void {
    const casing = new Graphics();
    casing.moveTo(x1, y1); casing.lineTo(x2, y2);
    casing.stroke({ color: 0x1c1c1a, width: 9 });
    this.connLayer.addChild(casing);

    const surface = new Graphics();
    surface.moveTo(x1, y1); surface.lineTo(x2, y2);
    surface.stroke({ color: 0x272724, width: 5 });
    this.connLayer.addChild(surface);

    const center = new Graphics();
    center.moveTo(x1, y1); center.lineTo(x2, y2);
    center.stroke({ color: 0x302f2a, width: 1, alpha: 0.4 });
    this.connLayer.addChild(center);
  }

  // ─── Zone territory blob ──────────────────────────────────────────────
  private drawZoneArea(zone: ZoneState, x: number, y: number, alpha: number): void {
    const color = ZONE_COLORS[zone.type] ?? 0x444444;
    const r = 42;

    const area = new Graphics();
    area.circle(0, 0, r);
    area.fill({ color, alpha: alpha * 0.18 });
    area.x = x; area.y = y;
    this.areaLayer.addChild(area);
  }

  // ─── Unknown zone hint ────────────────────────────────────────────────
  private drawUnknownMarker(x: number, y: number): void {
    const g = new Graphics();
    g.circle(0, 0, 10);
    g.fill({ color: 0x222220, alpha: 0.6 });
    g.x = x; g.y = y;
    this.areaLayer.addChild(g);

    const label = new Text({
      text: '?',
      style: { fill: 0x333330, fontSize: 11, fontFamily: 'sans-serif', fontWeight: '700' },
    });
    label.anchor.set(0.5);
    label.x = x; label.y = y;
    this.areaLayer.addChild(label);
  }

  // ─── Zone marker ──────────────────────────────────────────────────────
  private buildMarker(
    zone: ZoneState,
    currentId: string,
    selectedId: string | null,
    alpha: number,
    selectionMode: boolean,
  ): Container {
    const c = new Container();
    const isCurrent  = zone.id === currentId;
    const isSelected = zone.id === selectedId;
    const color      = ZONE_COLORS[zone.type] ?? 0x444444;
    const r          = isCurrent ? 22 : 18;

    // Glow ring for selected
    if (isSelected) {
      const glow = new Graphics();
      glow.circle(0, 0, r + 11);
      glow.fill({ color: 0xc9a961, alpha: 0.08 });
      glow.stroke({ color: 0xc9a961, width: 1.5, alpha: 0.6 });
      c.addChild(glow);
    }

    // Outer ring (border)
    const ring = new Graphics();
    ring.circle(0, 0, r + 3);
    ring.fill({ color: 0x0d0d0c, alpha });
    c.addChild(ring);

    // Main circle
    const disc = new Graphics();
    disc.circle(0, 0, r);
    disc.fill({ color, alpha });
    disc.stroke({
      color: isCurrent ? 0xc9a961 : (isSelected ? 0xd4d4c8 : 0x444440),
      width: isCurrent ? 2.5 : 1.5,
      alpha,
    });
    c.addChild(disc);

    // Player dot
    if (isCurrent) {
      const dot = new Graphics();
      dot.circle(0, 0, 6);
      dot.fill({ color: 0xc9a961 });
      c.addChild(dot);
    }

    // High-danger badge
    if (zone.danger >= 7 && (zone.fog === 'explored' || selectionMode)) {
      const badge = new Graphics();
      badge.circle(r - 2, -r + 2, 7);
      badge.fill({ color: 0x7a1f1f });
      const danger = new Text({ text: '!', style: { fill: 0xff8888, fontSize: 9, fontWeight: '700' } });
      danger.anchor.set(0.5);
      danger.x = r - 2; danger.y = -r + 2;
      c.addChild(badge);
      c.addChild(danger);
    }

    // Zone type label inside circle
    if (zone.fog === 'explored' || zone.fog === 'scouted' || selectionMode) {
      const typeIcon = new Text({
        text: ZONE_ICONS[zone.type] ?? '?',
        style: {
          fill: 0xffffff,
          fontSize: 7,
          fontFamily: 'Barlow Condensed, sans-serif',
          letterSpacing: 0.5,
          alpha: 0.7,
        },
      });
      typeIcon.anchor.set(0.5);
      typeIcon.y = isCurrent ? 8 : 6;
      c.addChild(typeIcon);
    }

    // Zone name label
    const nameAlpha = alpha < 0.5 ? 0.4 : 1;
    const nameLabel = new Text({
      text: zone.name.toUpperCase(),
      style: {
        fill: isSelected ? 0xc9a961 : 0xd4d4c8,
        fontSize: 8,
        fontFamily: 'Barlow Condensed, sans-serif',
        letterSpacing: 0.8,
        fontWeight: isSelected ? '700' : '400',
        alpha: nameAlpha,
      },
    });
    nameLabel.anchor.set(0.5, 0);
    nameLabel.y = r + 6;
    c.addChild(nameLabel);

    return c;
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
