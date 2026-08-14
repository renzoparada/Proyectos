"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
  type OnConnect,
} from "@xyflow/react";
import {
  ArrowLeft,
  Copy,
  GitBranch,
  Link2,
  PlayCircle,
  Save,
  Square,
  StopCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { WorkflowMetaForm, type WorkflowMetaFormValues } from "@/components/workflows/WorkflowMetaForm";
import { WORKFLOW_NODE_TYPES_MAP, type FlowNodeData } from "@/components/workflows/nodes";
import { WORKFLOW_NODE_META, DEFAULT_NODE_LABEL, type WorkflowNodeType } from "@/lib/workflow-meta";
import { dbToFlowEdges, dbToFlowNodes, flowEdgesToPayload, flowNodesToPayload } from "@/lib/workflow-graph";
import { formatDate } from "@/lib/utils";
import { canWrite, type Role } from "@/lib/permissions";
import type { WorkflowDTO, WorkflowSummaryDTO } from "@/types/workflow";

const PALETTE: { type: WorkflowNodeType; icon: typeof PlayCircle }[] = [
  { type: "START", icon: PlayCircle },
  { type: "TASK", icon: Square },
  { type: "DECISION", icon: GitBranch },
  { type: "END", icon: StopCircle },
  { type: "SUBFLOW", icon: Link2 },
];

function WorkflowEditorInner({
  workflow: initialWorkflow,
  otherWorkflows,
  projects,
  currentRole,
}: {
  workflow: WorkflowDTO;
  otherWorkflows: WorkflowSummaryDTO[];
  projects: { id: string; name: string }[];
  currentRole: Role;
}) {
  const readOnly = !canWrite(currentRole);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const workflowNameById = useMemo(
    () => new Map(otherWorkflows.map((w) => [w.id, w.name])),
    [otherWorkflows]
  );

  const [meta, setMeta] = useState({
    id: initialWorkflow.id,
    name: initialWorkflow.name,
    version: initialWorkflow.version,
    isTemplate: initialWorkflow.isTemplate,
    projectId: initialWorkflow.projectId,
    project: initialWorkflow.project,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(
    dbToFlowNodes(initialWorkflow, workflowNameById)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(dbToFlowEdges(initialWorkflow));

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      let label: string | undefined;
      if (sourceNode?.data.nodeType === "DECISION") {
        if (connection.sourceHandle === "yes") label = "Sí";
        else if (connection.sourceHandle === "no") label = "No";
      }
      setEdges((eds) =>
        addEdge(
          { ...connection, type: "smoothstep", label, markerEnd: { type: MarkerType.ArrowClosed } },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodeId(selNodes[0]?.id ?? null);
      setSelectedEdgeId(selEdges[0]?.id ?? null);
    },
    []
  );

  function addNodeAt(type: WorkflowNodeType, clientX?: number, clientY?: number) {
    if (readOnly) return;
    let position: { x: number; y: number };
    if (clientX !== undefined && clientY !== undefined) {
      // Drag-and-drop from the palette: use the actual drop point.
      position = screenToFlowPosition({ x: clientX, y: clientY });
    } else {
      // Click-to-add: cascade new nodes in a grid using flow-space
      // coordinates directly, so spacing stays consistent regardless of the
      // current zoom/pan (screen-space offsets would shrink at high zoom
      // and made nodes land on top of each other).
      const idx = nodes.length;
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      position = { x: 80 + col * 220, y: 280 + row * 130 };
    }
    const id = crypto.randomUUID();
    const newNode: Node<FlowNodeData> = {
      id,
      type,
      position,
      data: { label: DEFAULT_NODE_LABEL[type], nodeType: type, meta: null },
    };
    setNodes((nds) => nds.concat(newNode));
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e: React.DragEvent) {
    if (readOnly) return;
    e.preventDefault();
    const type = e.dataTransfer.getData("application/workflow-node") as WorkflowNodeType;
    if (!type) return;
    addNodeAt(type, e.clientX, e.clientY);
  }

  function updateSelectedNodeLabel(label: string) {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, label } } : n)));
  }

  function updateSelectedNodeTarget(targetWorkflowId: string) {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                meta: targetWorkflowId ? { targetWorkflowId } : null,
                targetWorkflowName: workflowNameById.get(targetWorkflowId),
              },
            }
          : n
      )
    );
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }

  function updateSelectedEdgeLabel(label: string) {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.map((e) => (e.id === selectedEdgeId ? { ...e, label } : e)));
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }

  async function handleSave(bumpVersion: boolean) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/workflows/${meta.id}/graph?bumpVersion=${bumpVersion}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: flowNodesToPayload(nodes),
          edges: flowEdgesToPayload(edges),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "No se pudo guardar el flujo");
        return;
      }
      const w = data.workflow as WorkflowDTO;
      setMeta((m) => ({ ...m, version: w.version }));
      setNodes(dbToFlowNodes(w, workflowNameById));
      setEdges(dbToFlowEdges(w));
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  async function handleMetaSave(values: WorkflowMetaFormValues) {
    const res = await fetch(`/api/workflows/${meta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "No se pudo actualizar el flujo";
    setMeta((m) => ({
      ...m,
      name: data.workflow.name,
      isTemplate: data.workflow.isTemplate,
      projectId: data.workflow.projectId,
      project: data.workflow.project,
    }));
    setEditingMeta(false);
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/workflows/${meta.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) router.push(`/workflows/${data.workflow.id}`);
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workflows/${meta.id}`, { method: "DELETE" });
      if (res.ok) router.push("/workflows");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Link href="/workflows" className="text-muted hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-foreground">{meta.name}</h1>
            {!readOnly && (
              <button
                onClick={() => setEditingMeta(true)}
                className="text-xs text-accent hover:underline"
              >
                editar
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Badge tone="neutral">v{meta.version}</Badge>
            {meta.isTemplate ? (
              <Badge tone="accent">Plantilla</Badge>
            ) : meta.project ? (
              <Link href={`/projects/${meta.project.id}`} className="hover:underline">
                {meta.project.name}
              </Link>
            ) : null}
            {savedAt && <span>· Guardado {formatDate(savedAt)}</span>}
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {readOnly ? (
            <Badge tone="neutral">Solo lectura</Badge>
          ) : (
            <>
              {saveError && <span className="text-xs text-danger">{saveError}</span>}
              <Button variant="secondary" size="sm" onClick={handleDuplicate} disabled={duplicating}>
                <Copy size={14} /> Duplicar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} className="text-danger" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleSave(true)} disabled={saving}>
                Nueva versión
              </Button>
              <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
                <Save size={14} /> {saving ? "Guardando…" : "Guardar"}
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!readOnly && (
          <aside className="hidden w-44 shrink-0 border-r border-border bg-surface p-3 sm:block">
            <p className="mb-2 text-xs font-medium text-muted">Agregar nodo</p>
            <div className="flex flex-col gap-1.5">
              {PALETTE.map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/workflow-node", type)}
                  onClick={() => addNodeAt(type)}
                  title={WORKFLOW_NODE_META[type].description}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left text-xs font-medium text-foreground hover:border-accent/40 hover:bg-surface-hover"
                >
                  <Icon size={14} className="shrink-0 text-accent" />
                  {WORKFLOW_NODE_META[type].label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted">
              Arrastra o haz click para agregar. Conecta arrastrando desde el borde de un nodo.
            </p>
          </aside>
        )}

        <div ref={wrapperRef} className="react-flow-shell relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={readOnly ? undefined : onConnect}
            onSelectionChange={onSelectionChange}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={WORKFLOW_NODE_TYPES_MAP}
            fitView
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            deleteKeyCode={readOnly ? [] : ["Backspace", "Delete"]}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!bg-surface" />
          </ReactFlow>
        </div>

        {(selectedNode || selectedEdge) && (
          <aside className="w-72 shrink-0 border-l border-border bg-surface p-4">
            {selectedNode && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge tone="neutral">{WORKFLOW_NODE_META[selectedNode.data.nodeType].label}</Badge>
                  {!readOnly && (
                    <button
                      onClick={deleteSelectedNode}
                      className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-danger"
                      aria-label="Eliminar nodo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <Field label="Etiqueta">
                  <Input
                    value={selectedNode.data.label}
                    disabled={readOnly}
                    onChange={(e) => updateSelectedNodeLabel(e.target.value)}
                  />
                </Field>
                {selectedNode.data.nodeType === "SUBFLOW" && (
                  <Field label="Flujo enlazado" hint="Se puede abrir con el ícono ↗ sobre el nodo">
                    <Select
                      value={selectedNode.data.meta?.targetWorkflowId ?? ""}
                      disabled={readOnly}
                      onChange={(e) => updateSelectedNodeTarget(e.target.value)}
                    >
                      <option value="">Sin enlazar</option>
                      {otherWorkflows.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                {selectedNode.data.nodeType === "DECISION" && (
                  <p className="rounded-md bg-surface-hover px-2.5 py-2 text-xs text-muted">
                    Este nodo tiene dos salidas: arrástralas desde el punto derecho (&ldquo;Sí&rdquo;) y
                    el punto inferior (&ldquo;No&rdquo;).
                  </p>
                )}
              </div>
            )}
            {selectedEdge && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge tone="neutral">Conector</Badge>
                  {!readOnly && (
                    <button
                      onClick={deleteSelectedEdge}
                      className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-danger"
                      aria-label="Eliminar conector"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <Field label="Etiqueta" hint='Ej: "Sí" / "No" / "Aprobado"'>
                  <Input
                    value={typeof selectedEdge.label === "string" ? selectedEdge.label : ""}
                    disabled={readOnly}
                    onChange={(e) => updateSelectedEdgeLabel(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </aside>
        )}
      </div>

      <Modal open={editingMeta} onClose={() => setEditingMeta(false)} title="Editar flujo">
        <WorkflowMetaForm
          workflow={meta}
          projects={projects}
          onCancel={() => setEditingMeta(false)}
          onSubmit={handleMetaSave}
        />
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Eliminar flujo">
        <p className="text-sm text-foreground">
          ¿Seguro que quieres eliminar <strong>{meta.name}</strong>? No se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function WorkflowEditor(props: {
  workflow: WorkflowDTO;
  otherWorkflows: WorkflowSummaryDTO[];
  projects: { id: string; name: string }[];
  currentRole: Role;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
