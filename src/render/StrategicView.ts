import { Application, Graphics, Container, Text } from 'pixi.js';
import type { ZoneState } from '../engine/world/Zone';
import { FogOfWar } from '../engine/world/FogOfWar';

type ClickHandler = (zoneId: string) => void;

const PADDING = 55;

const ZONE_COLORS: Record<string, number> = {
  residential: 0x5a7a4a,
  commercial: 0x4a5a7a,
  industrial: 0x7a5a3a,
  medical: 0x3a8a6a,
  military: 0x7a3a3a,
  wild: 0x3a6a3a,
};

export class StrategicView {
  private connLayer = new Container();
  private zoneLayer = new Container();

  constructor(private app: Application) {
    this.app.stage.addChild(this.connLayer);
    this.app.stage.addChild(this.zoneLayer);
  }

  render(
    zones: ZoneState[],
    currentZoneId: string,
    selectedZoneId: string | null,
    onClick: ClickHandler,
  ): void {
    this.connLayer.removeChildren();
    this.zoneLayer.removeChildren();

    const { width, height } = this.app.screen;
    const pw = width - PADDING * 2;
    const ph = height - PADDING * 2;
    const tx = (nx: number) => PADDING + nx * pw;
    const ty = (ny: number) => PADDING + ny * ph;

    // Connections (drawn beneath zones)
    for (const zone of zones) {
      if (!FogOfWar.isVisible(zone.fog)) continue;
      for (const connId of zone.connections) {
        if (connId > zone.id) continue; // draw each pair once
        const conn = zones.find((z) => z.id === connId);
        if (!conn || !FogOfWar.isVisible(conn.fog)) continue;

        const g = new Graphics();
        g.moveTo(tx(zone.position.x), ty(zone.position.y));
        g.lineTo(tx(conn.position.x), ty(conn.position.y));
        g.stroke({ color: 0x2a2a26, width: 2 });
        this.connLayer.addChild(g);
      }
    }

    // Zone nodes
    for (const zone of zones) {
      const node = this.buildNode(zone, currentZoneId, selectedZoneId);
      node.x = tx(zone.position.x);
      node.y = ty(zone.position.y);

      if (FogOfWar.isVisible(zone.fog)) {
        node.eventMode = 'static';
        node.cursor = 'pointer';
        node.on('pointerdown', () => onClick(zone.id));
      }

      this.zoneLayer.addChild(node);
    }
  }

  private buildNode(
    zone: ZoneState,
    currentId: string,
    selectedId: string | null,
  ): Container {
    const c = new Container();
    if (!FogOfWar.isVisible(zone.fog)) return c;

    const isCurrent = zone.id === currentId;
    const isSelected = zone.id === selectedId;
    const alpha = FogOfWar.alpha(zone.fog);
    const r = isCurrent ? 20 : 16;
    const color = ZONE_COLORS[zone.type] ?? 0x555555;

    // Selection ring
    if (isSelected) {
      const ring = new Graphics();
      ring.circle(0, 0, r + 9);
      ring.fill({ color: 0xc9a961, alpha: 0.1 });
      ring.stroke({ color: 0xc9a961, width: 1.5, alpha: 0.65 });
      c.addChild(ring);
    }

    // Zone circle
    const g = new Graphics();
    g.circle(0, 0, r);
    g.fill({ color, alpha });
    g.stroke({ color: isCurrent ? 0xc9a961 : 0x444444, width: isCurrent ? 2.5 : 1.5, alpha });
    c.addChild(g);

    // Player dot
    if (isCurrent) {
      const dot = new Graphics();
      dot.circle(0, 0, 5);
      dot.fill({ color: 0xc9a961 });
      c.addChild(dot);
    }

    // High-danger badge
    if (zone.danger >= 7 && zone.fog === 'explored') {
      const badge = new Graphics();
      badge.circle(r - 3, -r + 3, 6);
      badge.fill({ color: 0x7a1f1f });
      c.addChild(badge);
    }

    // Zone name label
    const label = new Text({
      text: zone.name.toUpperCase(),
      style: {
        fill: zone.fog === 'scouted' ? 0x666655 : 0xd4d4c8,
        fontSize: 9,
        fontFamily: 'Barlow Condensed, sans-serif',
        letterSpacing: 1,
      },
    });
    label.anchor.set(0.5, 0);
    label.y = r + 5;
    c.addChild(label);

    return c;
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
