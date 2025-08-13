import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Camera, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  BookOpen,
  Upload,
  Image as ImageIcon,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  external_link?: string;
  user_id: string;
  created_at: string;
  tags: string[];
}

export function Recipes() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    category: 'main',
    tags: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'all', label: 'Tutte' },
    { value: 'breakfast', label: 'Colazione' },
    { value: 'main', label: 'Piatto Principale' },
    { value: 'side', label: 'Contorno' },
    { value: 'dessert', label: 'Dolce' },
    { value: 'snack', label: 'Spuntino' },
    { value: 'drink', label: 'Bevanda' }
  ];

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

  const loadRecipes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading recipes:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile caricare le ricette',
          variant: 'destructive'
        });
      } else {
        setRecipes(data || []);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le ricette',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'Errore',
          description: 'L\'immagine deve essere inferiore a 10MB',
          variant: 'destructive'
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calcola le nuove dimensioni mantenendo l'aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Disegna l'immagine ottimizzata
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converti in blob
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const analyzeImageWithAI = async (imageUrl: string): Promise<Partial<Recipe>> => {
    try {
      const { analyzeRecipeImage } = await import('@/lib/recipeAnalysis');
      const analysis = await analyzeRecipeImage(imageUrl);
      
      return {
        title: analysis.title || '',
        description: analysis.description || '',
        category: analysis.category || 'main',
        tags: analysis.tags || []
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Attenzione',
        description: 'Impossibile analizzare l\'immagine. Compila manualmente i campi.',
        variant: 'default'
      });
      return {};
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const optimizedFile = await optimizeImage(file);
    const fileName = `${user?.id}/${Date.now()}-${file.name}`;
    
    // Prova prima con il bucket recipe-images, se non esiste usa avatars
    let bucketName = 'recipe-images';
    let { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, optimizedFile);

    // Se il bucket recipe-images non esiste, usa avatars
    if (error && error.message.includes('bucket') || error.message.includes('not found')) {
      bucketName = 'avatars';
      ({ data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, optimizedFile));
    }

    if (error) {
      console.error('Storage upload error:', error);
      const errorMessage = error.message || error.toString() || 'Errore sconosciuto';
      
      if (errorMessage.includes('bucket') || errorMessage.includes('not found')) {
        throw new Error('Bucket di storage non configurato. Contatta l\'amministratore.');
      } else if (errorMessage.includes('file size')) {
        throw new Error('L\'immagine è troppo grande. Riduci le dimensioni.');
      } else if (errorMessage.includes('mime type')) {
        throw new Error('Formato immagine non supportato. Usa JPEG, PNG o WebP.');
      } else if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
        throw new Error('Errore di permessi. Prova a ricaricare la pagina e riprova.');
      } else {
        throw new Error('Errore nel caricamento dell\'immagine: ' + errorMessage);
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const addRecipe = async () => {
    if (!user || !newRecipe.title?.trim()) {
      toast({
        title: 'Errore',
        description: 'Il titolo è obbligatorio',
        variant: 'destructive'
      });
      return;
    }

    setUploadingImage(true);
    try {
      let imageUrl = '';
      
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const recipeData = {
        ...newRecipe,
        user_id: user.id,
        image_url: imageUrl || null
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single();

      if (error) {
        console.error('Error adding recipe:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile aggiungere la ricetta',
          variant: 'destructive'
        });
      } else {
        setRecipes([data, ...recipes]);
        setShowAddDialog(false);
        resetForm();
        toast({
          title: 'Successo',
          description: 'Ricetta aggiunta con successo'
        });
      }
    } catch (error) {
      console.error('Error adding recipe:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiungere la ricetta',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting recipe:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile eliminare la ricetta',
          variant: 'destructive'
        });
      } else {
        setRecipes(recipes.filter(recipe => recipe.id !== id));
        toast({
          title: 'Successo',
          description: 'Ricetta eliminata con successo'
        });
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare la ricetta',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setNewRecipe({
      title: '',
      description: '',
      category: 'main',
      tags: []
    });
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzingImage(true);
    try {
      // Prima carica l'immagine per ottenere l'URL
      const imageUrl = await uploadImage(selectedImage);
      
      // Poi analizza con AI
      const analysis = await analyzeImageWithAI(imageUrl);
      
      setNewRecipe(prev => ({
        ...prev,
        ...analysis
      }));
      
      toast({
        title: 'Analisi completata',
        description: 'I campi sono stati compilati automaticamente'
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile analizzare l\'immagine',
        variant: 'destructive'
      });
    } finally {
      setAnalyzingImage(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Caricamento ricette...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Le Mie Ricette</h1>
            <p className="text-gray-400">Gestisci le tue ricette preferite</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Ricetta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuova Ricetta</DialogTitle>
                <DialogDescription>
                  Aggiungi una nuova ricetta. Puoi caricare una foto per analisi automatica.
                </DialogDescription>
              </DialogHeader>
              
              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Cambia Foto
                        </Button>
                        <Button
                          onClick={handleAnalyzeImage}
                          disabled={analyzingImage}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {analyzingImage ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ImageIcon className="h-4 w-4 mr-2" />
                          )}
                          {analyzingImage ? 'Analizzando...' : 'Analizza con AI'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400 mb-2">Carica una foto della ricetta</p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Scegli Foto
                      </Button>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Titolo *</label>
                    <Input
                      value={newRecipe.title || ''}
                      onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                      placeholder="Nome della ricetta"
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Descrizione</label>
                    <Textarea
                      value={newRecipe.description || ''}
                      onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                      placeholder="Descrizione della ricetta"
                      rows={3}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Categoria</label>
                    <select
                      value={newRecipe.category || 'main'}
                      onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                    >
                      {categories.filter(c => c.value !== 'all').map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Link Esterno (opzionale)</label>
                    <Input
                      value={newRecipe.external_link || ''}
                      onChange={(e) => setNewRecipe({ ...newRecipe, external_link: e.target.value })}
                      placeholder="https://..."
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={addRecipe}
                    disabled={uploadingImage || !newRecipe.title?.trim()}
                    className="flex-1 bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {uploadingImage ? 'Salvando...' : 'Salva Ricetta'}
                  </Button>
                  <Button
                    onClick={() => setShowAddDialog(false)}
                    variant="outline"
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca ricette..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Nessuna ricetta trovata</h3>
            <p className="text-gray-400">
              {recipes.length === 0 
                ? 'Inizia aggiungendo la tua prima ricetta!' 
                : 'Prova a modificare i filtri di ricerca'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{recipe.title}</CardTitle>
                          <CardDescription className="text-gray-400 mb-3">
                            {recipe.description}
                          </CardDescription>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-blue-600">
                              {getCategoryLabel(recipe.category)}
                            </Badge>
                            {recipe.external_link && (
                              <Badge variant="outline" className="border-green-500 text-green-400">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Link
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => deleteRecipe(recipe.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {recipe.image_url && (
                        <div className="mb-4">
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      {recipe.external_link && (
                        <a
                          href={recipe.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Vedi ricetta originale
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
