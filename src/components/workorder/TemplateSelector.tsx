import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client"; // Removed - using backend API
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string | null;
  default_items: string[];
  is_default: boolean;
}

interface TemplateSelectorProps {
  onTemplateSelect: (items: string[]) => void;
  selectedItems: string[];
}

const TemplateSelector = ({ onTemplateSelect, selectedItems }: TemplateSelectorProps) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    items: ""
  });

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('work_order_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      
      // Transform the data to match our interface with proper type handling
      const transformedData: Template[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        is_default: item.is_default || false,
        default_items: Array.isArray(item.default_items) 
          ? (item.default_items as string[]).filter(item => typeof item === 'string')
          : []
      }));
      
      setTemplates(transformedData);

      // Create default templates if none exist
      if (!data || data.length === 0) {
        await createDefaultTemplates();
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createDefaultTemplates = async () => {
    if (!user) return;

    const defaultTemplates = [
      {
        name: "Full Inspection",
        description: "Complete vehicle inspection checklist",
        default_items: [
          "Check engine oil level",
          "Inspect brake pads", 
          "Check tire pressure and tread",
          "Test lights and signals",
          "Inspect belts and hoses",
          "Check fluid levels",
          "Test battery and charging system",
          "Inspect suspension components"
        ],
        is_default: true
      },
      {
        name: "Oil Change",
        description: "Standard oil change service",
        default_items: [
          "Drain old oil",
          "Replace oil filter",
          "Install new oil",
          "Check fluid levels",
          "Reset maintenance indicator"
        ],
        is_default: true
      },
      {
        name: "Brake Service",
        description: "Brake system maintenance and repair",
        default_items: [
          "Inspect brake pads",
          "Check brake fluid",
          "Test brake pedal feel",
          "Inspect brake lines",
          "Check rotor condition"
        ],
        is_default: true
      }
    ];

    try {
      for (const template of defaultTemplates) {
        await supabase
          .from('work_order_templates')
          .insert({
            user_id: user.id,
            ...template
          });
      }
      fetchTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  };

  const createTemplate = async () => {
    if (!user || !newTemplate.name.trim()) return;

    try {
      const items = newTemplate.items
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const { error } = await supabase
        .from('work_order_templates')
        .insert({
          user_id: user.id,
          name: newTemplate.name,
          description: newTemplate.description || null,
          default_items: items,
          is_default: false
        });

      if (error) throw error;

      toast.success('Template created successfully');
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: "", description: "", items: "" });
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate || !newTemplate.name.trim()) return;

    try {
      const items = newTemplate.items
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const { error } = await supabase
        .from('work_order_templates')
        .update({
          name: newTemplate.name,
          description: newTemplate.description || null,
          default_items: items
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast.success('Template updated successfully');
      setEditingTemplate(null);
      setNewTemplate({ name: "", description: "", items: "" });
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('work_order_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template.default_items);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description || "",
      items: template.default_items.join('\n')
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Work Order Templates</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingTemplate(null);
            setNewTemplate({ name: "", description: "", items: "" });
            setIsCreateDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              JSON.stringify(selectedItems.sort()) === JSON.stringify(template.default_items.sort())
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : ''
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {template.name}
                    {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    {JSON.stringify(selectedItems.sort()) === JSON.stringify(template.default_items.sort()) && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </CardTitle>
                  {template.description && (
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(template);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {!template.is_default && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(template.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-600">
                {template.default_items.length} item{template.default_items.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update your work order template' : 'Create a reusable work order template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="e.g., Monthly Inspection"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Input
                id="template-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Brief description of this template"
              />
            </div>
            <div>
              <Label htmlFor="template-items">Work Items (One per line)</Label>
              <Textarea
                id="template-items"
                value={newTemplate.items}
                onChange={(e) => setNewTemplate({...newTemplate, items: e.target.value})}
                placeholder="Check engine oil&#10;Inspect brakes&#10;Test lights"
                className="min-h-32"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingTemplate(null);
                  setNewTemplate({ name: "", description: "", items: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={editingTemplate ? updateTemplate : createTemplate}
                disabled={!newTemplate.name.trim()}
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateSelector;
