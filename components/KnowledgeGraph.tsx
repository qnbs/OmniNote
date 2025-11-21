
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { select } from 'd3-selection';
import { forceSimulation, forceLink, forceManyBody, forceCenter, Simulation, ForceLink } from 'd3-force';
import { drag, D3DragEvent } from 'd3-drag';
import { zoom, D3ZoomEvent } from 'd3-zoom';
import { Note, GraphNode, GraphLink } from '../types';
import { Share2 } from './icons';
import { useLocale } from '../contexts/LocaleContext';
import { WIKI_LINK_REGEX, findNoteByTitle } from '../utils/noteUtils';

interface KnowledgeGraphProps {
  notes: Note[];
  onNodeClick: (id: string) => void;
  activeNodeId: string | null;
  colors: {
      link: string;
      node: string;
      activeNode: string;
      text: string;
      stroke: string;
  };
  charge: number;
  linkDistance: number;
}

const createDragHandler = (simulation: Simulation<GraphNode, GraphLink>) => {
  function dragstarted(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
    if (!event.active) simulation.alphaTarget(0).restart();
    d.fx = null;
    d.fy = null;
  }

  return drag<SVGGElement, GraphNode>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};


const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ notes, onNodeClick, activeNodeId, colors, charge, linkDistance }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const { t } = useLocale();

  // Memoize graph data to prevent re-computation on every content change
  const { nodes, links, linkedByIndex } = useMemo(() => {
    const graphNodes: GraphNode[] = notes.map(note => ({
      id: note.id,
      title: note.title,
      radius: 8 + Math.min(Math.floor(note.content.length / 100), 12),
    }));

    const linkSet = new Set<string>();
    const finalLinks: GraphLink[] = [];

    // 1. Links from tags
    const tagMap: { [key:string]: string[] } = {};
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if (!tagMap[tag]) tagMap[tag] = [];
        tagMap[tag].push(note.id);
      });
    });

    Object.values(tagMap).forEach(noteIds => {
      if (noteIds.length > 1) {
        for (let i = 0; i < noteIds.length; i++) {
          for (let j = i + 1; j < noteIds.length; j++) {
            const source = noteIds[i];
            const target = noteIds[j];
            const key = [source, target].sort().join('-');
            if (!linkSet.has(key)) {
                linkSet.add(key);
                finalLinks.push({ source, target, type: 'tag' });
            }
          }
        }
      }
    });
    
    // 2. Links from [[Wiki-Links]]
    notes.forEach(note => {
        const matches = note.content.matchAll(WIKI_LINK_REGEX);
        for (const match of matches) {
            const targetTitle = match[1];
            const targetNote = findNoteByTitle(notes, targetTitle);
            if (targetNote && targetNote.id !== note.id) {
                const source = note.id;
                const target = targetNote.id;
                const key = [source, target].sort().join('-');
                // We allow directed links for wiki-links, so key is not sorted
                const directedKey = `${source}->${target}`;
                 if (!linkSet.has(directedKey)) {
                    linkSet.add(directedKey);
                    finalLinks.push({ source, target, type: 'explicit' });
                }
            }
        }
    });
    
    const linkedByIndex: {[key: string]: boolean} = {};
    finalLinks.forEach(d => {
        const sourceId = (d.source as GraphNode).id || (d.source as string);
        const targetId = (d.target as GraphNode).id || (d.target as string);
        linkedByIndex[`${sourceId},${targetId}`] = true;
    });

    return { nodes: graphNodes, links: finalLinks, linkedByIndex };
  }, [notes]);
  
  const isConnected = useCallback((aId: string, bId: string) => {
    return linkedByIndex[`${aId},${bId}`] || linkedByIndex[`${bId},${aId}`] || aId === bId;
  }, [linkedByIndex]);

  const updateNodeAndLinkAppearance = useCallback(() => {
    if (!gRef.current) return;
    const g = select(gRef.current);
    const node = g.selectAll<SVGGElement, GraphNode>('.node');
    const link = g.selectAll<SVGLineElement, GraphLink>('.link');
    const text = g.selectAll<SVGTextElement, GraphNode>('.node-text');

    if (!activeNodeId) {
        node.style('opacity', 1);
        link.style('opacity', l => l.type === 'explicit' ? 0.9 : 0.6);
        text.style('opacity', 1);
        return;
    }
    
    node.style('opacity', d => isConnected(activeNodeId, d.id) ? 1.0 : 0.2);
    link.style('opacity', d => {
        const sourceId = (d.source as GraphNode).id || (d.source as string);
        const targetId = (d.target as GraphNode).id || (d.target as string);
        return sourceId === activeNodeId || targetId === activeNodeId ? 1.0 : 0.1;
    });
    text.style('opacity', d => isConnected(activeNodeId, d.id) ? 1.0 : 0.2);

  }, [activeNodeId, isConnected]);


  // One-time setup effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);
    
    svg.append("g").each(function() { gRef.current = this as SVGGElement; });
    const g = select(gRef.current);

    simulationRef.current = forceSimulation<GraphNode, GraphLink>([])
      .force('link', forceLink<GraphNode, GraphLink>().id(d => d.id))
      .force('charge', forceManyBody())
      .force('center', forceCenter(0, 0))
      .alphaMin(0.01) // Keep the graph alive with subtle motion
      .on('tick', () => {
        g.selectAll('.node').attr('transform', d => `translate(${(d as GraphNode).x},${(d as GraphNode).y})`);
        g.selectAll('.link')
          .attr('x1', d => ((d as GraphLink).source as GraphNode).x!)
          .attr('y1', d => ((d as GraphLink).source as GraphNode).y!)
          .attr('x2', d => ((d as GraphLink).target as GraphNode).x!)
          .attr('y2', d => ((d as GraphLink).target as GraphNode).y!);
      });

    const zoomBehavior = zoom<SVGSVGElement, unknown>().on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', event.transform.toString());
    });
    svg.call(zoomBehavior);

    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) {
          return;
        }
        if (!svgRef.current) return;
        const { width, height } = entries[0].contentRect;
        select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height]);
        simulationRef.current?.force('center', forceCenter(0, 0));
      });
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    return () => {
        resizeObserver.disconnect();
        simulationRef.current?.stop();
    };
  }, []);

  // Effect to update simulation forces when props change
  useEffect(() => {
    if (!simulationRef.current) return;
    simulationRef.current.force('charge', forceManyBody().strength(charge));
    (simulationRef.current.force('link') as ForceLink<GraphNode, GraphLink>)?.links(links).distance(linkDistance);
    simulationRef.current.alpha(0.3).restart();
  }, [charge, linkDistance, links]);

  const nodeMouseOver = useCallback((_event: MouseEvent, d: GraphNode) => {
    if (!gRef.current) return;
    const g = select(gRef.current);
    g.selectAll<SVGGElement, GraphNode>('.node').style('opacity', o => isConnected(d.id, o.id) ? 1.0 : 0.2);
    g.selectAll<SVGLineElement, GraphLink>('.link').style('opacity', o => {
        const sourceId = (o.source as GraphNode).id || o.source as string;
        const targetId = (o.target as GraphNode).id || o.target as string;
        return sourceId === d.id || targetId === d.id ? 1.0 : 0.1
    });
    g.selectAll<SVGTextElement, GraphNode>('.node-text').style('opacity', o => isConnected(d.id, o.id) ? 1.0 : 0.2);
  }, [isConnected]);

  const nodeMouseOut = useCallback(() => {
    updateNodeAndLinkAppearance();
  }, [updateNodeAndLinkAppearance]);


  // Effect to update data and DOM elements
  useEffect(() => {
    if (!simulationRef.current || !gRef.current) return;

    simulationRef.current.nodes(nodes);

    const g = select(gRef.current);
    const simulation = simulationRef.current;
    
    const linkData = g.selectAll<SVGLineElement, GraphLink>('.link')
      .data(links, d => `${(d.source as GraphNode).id || (d.source as string)}_${(d.target as GraphNode).id || (d.target as string)}`);
    
    linkData.exit().remove();
    linkData.enter().append('line')
      .attr('class', 'link')
      .style('transition', 'opacity 300ms ease');


    const nodeData = g.selectAll<SVGGElement, GraphNode>('.node')
      .data(nodes, d => d.id);
    
    nodeData.exit().remove();
    const nodeEnter = nodeData.enter().append('g')
      .attr('class', 'node cursor-pointer')
      .call(createDragHandler(simulation))
      .on('click', (event, d) => onNodeClick(d.id))
      .on('mouseover', nodeMouseOver)
      .on('mouseout', nodeMouseOut);
    
    nodeEnter.append('circle').attr('stroke-width', 2).style('transition', 'r 300ms ease, fill 300ms ease, opacity 300ms ease');
    
    const node = nodeData.merge(nodeEnter);

    nodeEnter.append('text')
      .attr('class', 'node-text')
      .attr('x', d => d.radius + 5)
      .attr('y', 5)
      .attr('font-size', '12px')
      .attr('paint-order', 'stroke')
      .attr('stroke-width', 3)
      .style('transition', 'opacity 300ms ease');

    g.selectAll<SVGTextElement, GraphNode>('.node-text').text(d => d.title);

    simulation.alpha(0.3).restart();

  }, [nodes, links, onNodeClick, nodeMouseOver, nodeMouseOut]);

  // Effect for visual updates (colors, active state, neighborhood)
  useEffect(() => {
    if (!gRef.current) return;
    const g = select(gRef.current);

    g.selectAll<SVGLineElement, GraphLink>('.link')
        .attr('stroke', colors.link)
        .attr('stroke-width', d => d.type === 'explicit' ? 2.5 : 1.5)
        .attr('stroke-dasharray', d => d.type === 'explicit' ? '4 2' : 'none');
    
    const allNodes = g.selectAll<SVGGElement, GraphNode>('.node');
    
    allNodes.select('circle')
        .attr('stroke', colors.stroke)
        .attr('fill', d => d.id === activeNodeId ? colors.activeNode : colors.node)
        .attr('r', d => d.id === activeNodeId ? d.radius * 1.2 : d.radius);

    allNodes.select('text')
        .attr('stroke', colors.stroke)
        .attr('fill', colors.text);
    
    updateNodeAndLinkAppearance();

  }, [colors, activeNodeId, nodes, links, updateNodeAndLinkAppearance]);

  return (
    <div ref={containerRef} className="w-full h-full cursor-grab">
       {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
            <Share2 className="mx-auto h-16 w-16 text-slate-400" />
            <h3 className="mt-4 text-xl font-semibold">{t('graph.empty.title')}</h3>
            <p className="mt-1 text-slate-400">{t('graph.empty.description')}</p>
        </div>
      ) : (
        <svg ref={svgRef}></svg>
      )}
    </div>
  );
};

export default KnowledgeGraph;