
export interface GraphNode {
  id: string;
  title:string;
  radius: number;
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    index?: number;
    type?: 'tag' | 'explicit';
}
