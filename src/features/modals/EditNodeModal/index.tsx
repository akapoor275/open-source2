import React from "react";
import { Modal, Stack, Textarea, Button, Flex, Text, CloseButton, TextInput } from "@mantine/core";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";
import { modify, applyEdits } from "jsonc-parser";

export default function EditNodeModal(props: any) {
  const { opened, onClose } = props || {};
  const nodeData = useGraph(state => state.selectedNode);
  const getJson = useJson(state => state.getJson);
  const setJson = useJson(state => state.setJson);

  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("");

  React.useEffect(() => {
    if (!opened) return;
    if (!nodeData) {
      setName("");
      setColor("");
      return;
    }

    const nameRow = nodeData.text.find(r => r.key === "name");
    const colorRow = nodeData.text.find(r => r.key === "color");

    setName(nameRow ? String(nameRow.value ?? "") : "");
    setColor(colorRow ? String(colorRow.value ?? "") : "");
  }, [opened, nodeData]);

  const handleSave = () => {
    try {
      const path = nodeData?.path ?? [];
      let newJson = getJson();

      // update name
      if (typeof name !== "undefined") {
        const edits = modify(newJson, [...path, "name"] as any, name, {} as any);
        newJson = applyEdits(newJson, edits);
      }

      // update color
      if (typeof color !== "undefined") {
        const edits = modify(newJson, [...path, "color"] as any, color, {} as any);
        newJson = applyEdits(newJson, edits);
      }

      setJson(newJson);
      // update the left-hand editor contents so it reflects the change immediately
      try {
        useFile.getState().setContents({ contents: newJson, hasChanges: false, skipUpdate: true });
      } catch (e) {
        // ignore
      }
      // allow graph parser to rebuild nodes, then update selectedNode to the new node so popups show updated values
      setTimeout(() => {
        try {
          const nodes = useGraph.getState().nodes;
          const targetPath = nodeData?.path ?? [];
          const found = nodes.find(n => JSON.stringify(n.path ?? []) === JSON.stringify(targetPath ?? []));
          if (found) {
            useGraph.getState().setSelectedNode(found as any);
          }
        } catch (e) {
          // ignore
        }
      }, 50);

      onClose && onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal size="auto" opened={!!opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Flex justify="space-between" align="center">
          <Text fz="sm" fw={600}>Edit Node</Text>
          <CloseButton onClick={onClose} />
        </Flex>

        <TextInput label="Name" value={name} onChange={e => setName(e.currentTarget.value)} />
        <TextInput label="Color" placeholder="#RRGGBB or color name" value={color} onChange={e => setColor(e.currentTarget.value)} />

        <Flex justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Flex>
      </Stack>
    </Modal>
  );
}
