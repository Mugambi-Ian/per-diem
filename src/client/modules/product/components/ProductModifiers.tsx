import React from 'react';
import {ProductModifier} from "@/lib/modules/product/schema/product";

interface ProductModifiersProps {
    modifiers: ProductModifier[];
    addModifier: () => void;
    updateModifier: (index: number, updates: Partial<ProductModifier>) => void;
    removeModifier: (index: number) => void;
}

export const ProductModifiers: React.FC<ProductModifiersProps> = ({
    modifiers,
    addModifier,
    updateModifier,
    removeModifier,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modifiers</h3>
                <button onClick={addModifier} className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Add Modifier</button>
            </div>
            {modifiers.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No modifiers added.</p>
            )}
            {modifiers.map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Name"
                        value={m.name}
                        onChange={(e)=>updateModifier(idx,{name: e.target.value})}
                        className="md:col-span-7 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Price delta"
                        value={m.priceDelta}
                        onChange={(e)=>updateModifier(idx,{priceDelta: Number(e.target.value)})}
                        className="md:col-span-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                    <div className="md:col-span-2 flex justify-end">
                        <button type="button" onClick={()=>removeModifier(idx)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
                    </div>
                </div>
            ))}
        </div>
    );
};
