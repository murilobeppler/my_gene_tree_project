"use client";

import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Panel,
    Node as ReactFlowNode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import PersonNode from './PersonNode';
import ProfileDrawer from '../Profile/ProfileDrawer';
import { convertDataToFlow, getLayoutedElements } from '@/utils/treeLayout';
import { Person } from '@/types/family';
import { api } from '@/services/api';
import AddMemberDialog from './AddMemberDialog';

// Tipos de nó registrados
const nodeTypes = {
    person: PersonNode,
};

const FamilyTree = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState<Person>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

    // Add Member Dialog State
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [addRelationId, setAddRelationId] = React.useState<string | null>(null);

    const onAddRelativeClick = useCallback((id: string) => {
        setAddRelationId(id);
        setIsAddDialogOpen(true);
    }, []);

    // Trigger para recarregar dados
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    // Carregar dados da API
    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const response = await api.get('/people/?limit=100');
                const peopleList: any[] = response.data;

                // Transformar lista do backend (snake_case) em Record<string, Person> (camelCase)
                const peopleRecord: Record<string, Person> = {};

                peopleList.forEach(p => {
                    peopleRecord[p.id.toString()] = {
                        id: p.id.toString(),
                        firstName: p.first_name,
                        lastName: p.last_name,
                        gender: p.gender,
                        birthDate: p.birth_date,
                        deathDate: p.death_date,
                        bio: p.bio,
                        photoUrl: p.photo_url,
                        fatherId: p.father_id?.toString(),
                        motherId: p.mother_id?.toString(),
                        // Criar array de spouses/children se necessário para o layout, 
                        // mas o convertDataToFlow atual usa IDs pai/mae para inferir arestas
                        onAddRelative: onAddRelativeClick, // Injeta a função aqui!
                    };
                });

                // Se vazio, usar mock ou nada
                if (Object.keys(peopleRecord).length === 0) return;

                // Tenta achar o Murilo (ID 1) ou pega o primeiro
                const rootId = peopleRecord['1'] ? '1' : Object.keys(peopleRecord)[0];

                const familyData = {
                    rootId: rootId,
                    people: peopleRecord
                };

                const { nodes: initialNodes, edges: initialEdges } = convertDataToFlow(familyData);
                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    initialNodes,
                    initialEdges
                );

                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
            } catch (error) {
                console.error("Erro ao carregar árvore:", error);
            }
        };

        fetchFamilyData();
    }, [setNodes, setEdges, onAddRelativeClick, refreshTrigger]);


    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
        console.log('Node clicked:', node);
        if (node.type === 'person') {
            setSelectedPerson(node.data as Person);
            setIsDrawerOpen(true);
        }
    }, []);

    return (
        <div className="w-full h-screen bg-background relative flex">
            <div className="flex-1 h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-background"
                >
                    <Background gap={12} size={1} />
                    <Controls />
                    <Panel position="top-right" className="bg-card p-2 rounded shadow text-card-foreground">
                        <div className="text-sm font-bold">Familia Beppler</div>
                        <div className="text-xs text-muted-foreground">Gene Tree v0.1</div>
                    </Panel>
                </ReactFlow>
            </div>

            <ProfileDrawer
                person={selectedPerson}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />

            <AddMemberDialog
                isOpen={isAddDialogOpen}
                personId={addRelationId}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={() => {
                    setRefreshTrigger(prev => prev + 1); // Recarrega Arvore
                    alert("Membro adicionado com sucesso!");
                }}
            />
        </div>
    );
};

export default FamilyTree;
