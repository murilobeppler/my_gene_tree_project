import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Person } from '@/types/family';

interface PersonNodeProps {
    data: Person;
}

const PersonNode = ({ data }: PersonNodeProps) => {
    return (
        <div className="group relative px-4 py-3 shadow-lg rounded-xl bg-card border border-border min-w-[200px] hover:ring-2 hover:ring-primary transition-all">
            <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />

            <div className="flex items-center gap-3">
                {data.photoUrl ? (
                    <img
                        src={data.photoUrl}
                        alt={`${data.firstName} ${data.lastName}`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                    />
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
            ${data.gender === 'male' ? 'bg-blue-500' : data.gender === 'female' ? 'bg-rose-500' : 'bg-gray-500'}`}>
                        {data.firstName[0]}
                    </div>
                )}

                <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-card-foreground">
                        {data.firstName} {data.lastName}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {data.birthDate?.split('-')[0]}
                        {data.deathDate ? ` - ${data.deathDate.split('-')[0]}` : ''}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                        ID: {data.id}
                    </span>
                </div>
            </div>

            {/* Quick Add Button */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:scale-110 transition-transform"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Verifica se a função existe antes de chamar
                        if (data.onAddRelative) {
                            data.onAddRelative(data.id);
                        } else {
                            console.warn("onAddRelative not implemented for this node");
                        }
                    }}
                    title="Adicionar Parente"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
        </div>
    );
};

export default memo(PersonNode);
