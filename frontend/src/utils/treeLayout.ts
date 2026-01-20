import dagre from 'dagre';
import { Node as ReactFlowNode, Edge, Position } from 'reactflow';
import { FamilyTreeData, Person } from '@/types/family';

const nodeWidth = 220;
const nodeHeight = 100;

export const getLayoutedElements = <T extends object = any>(
    nodes: ReactFlowNode<T>[],
    edges: Edge[],
    direction = 'TB' // Top-Bottom
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = Position.Top;
        node.sourcePosition = Position.Bottom;

        // Shift do dagre é centralizado, ajustamos para top-left
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes: layoutedNodes, edges };
};

// Converte os dados brutos de FamilyTreeData em Nodes/Edges do ReactFlow
export const convertDataToFlow = (data: FamilyTreeData) => {
    const nodes: ReactFlowNode[] = [];
    const edges: Edge[] = [];

    Object.values(data.people).forEach((person) => {
        // Adiciona Nó
        nodes.push({
            id: person.id,
            type: 'person', // Custom type
            data: person,
            position: { x: 0, y: 0 }, // Será calculado pelo layout
        });

        // Adiciona Edges (Pais -> Filhos)
        // Se a pessoa tem filhos listados: (preferencialmente usamos filhos para desenhar edges descendo)
        // Mas nossos dados mockados tem `fatherId`, `motherId` e `children`. 
        // Vamos usar a relação Pais -> Este Nó

        if (person.fatherId) {
            edges.push({
                id: `e${person.fatherId}-${person.id}`,
                source: person.fatherId,
                target: person.id,
                type: 'smoothstep',
                animated: true,
            });
        }

        if (person.motherId) {
            edges.push({
                id: `e${person.motherId}-${person.id}`,
                source: person.motherId,
                target: person.id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#ff0072' } // Diferencia mãe se quiser
            });
        }
    });

    return { nodes, edges };
};
