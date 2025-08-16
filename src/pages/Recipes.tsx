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
  ExternalLink,
  Eye,
  ChefHat,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FridgeAnalyzer } from '@/components/FridgeAnalyzer';
import { RecipeGenerator } from '@/components/RecipeGenerator';
import { findMatchingRecipes } from '@/lib/recipeMatcher';

  interface Recipe {
    id: string;
    title: string;
    description: string;
    category: string;
    image_url?: string;
    images?: string[];
    external_link?: string;
    user_id: string;
    created_at: string;
    tags: string[];
    has_recipe_text?: boolean;
  }

export function Recipes() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    category: 'main',
    tags: [],
    has_recipe_text: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analyzingImageIndex, setAnalyzingImageIndex] = useState<number>(-1);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stati per l'analisi del frigo
  const [showFridgeAnalyzer, setShowFridgeAnalyzer] = useState(false);
  const [showRecipeGenerator, setShowRecipeGenerator] = useState(false);
  const [fridgeData, setFridgeData] = useState<any>(null);
  const [matchingRecipes, setMatchingRecipes] = useState<any[]>([]);
  const [showMatchingRecipes, setShowMatchingRecipes] = useState(false);

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

      setSelectedImages(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
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
    try {
      const optimizedFile = await optimizeImage(file);
      const fileName = `${user?.id}/${Date.now()}-${file.name}`;
      
      console.log('Attempting upload to recipe-images bucket...');
      
      // Prova prima con il bucket recipe-images
      let { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, optimizedFile);

      console.log('Upload result:', { data, error });

      // Se c'è un errore, prova con avatars
      if (error) {
        console.log('Recipe-images bucket failed, trying avatars...');
        ({ data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, optimizedFile));
        
        console.log('Avatars upload result:', { data, error });
      }

      if (error) {
        console.error('Storage upload error:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error || {}));
        
        let errorMessage = 'Errore sconosciuto';
        
        if (error && typeof error === 'object') {
          if (error.message) {
            errorMessage = error.message;
          } else if (error.toString) {
            errorMessage = error.toString();
          } else {
            errorMessage = JSON.stringify(error);
          }
        }
        
        console.error('Processed error message:', errorMessage);
        
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

      if (!data) {
        throw new Error('Nessun dato ricevuto dal server');
      }

      const bucketName = error ? 'avatars' : 'recipe-images';
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('Upload successful, public URL:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Upload function error:', err);
      throw err;
    }
  };

  // Cleanup delle immagini temporanee
  const cleanupTempImage = async (imageUrl: string): Promise<void> => {
    if (!supabase) return;
    
    try {
      // Estrai il path dal URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;
      
      // Prova prima recipe-images, poi avatars
      let { error } = await supabase.storage
        .from('recipe-images')
        .remove([filePath]);
      
      if (error) {
        // Fallback al bucket avatars
        await supabase.storage
          .from('avatars')
          .remove([filePath]);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  };

  // Retry logic per analisi fallite
  const retryAnalysis = async (image: File, maxRetries = 2): Promise<any> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const imageUrl = await uploadImage(image);
        const analysis = await analyzeImageWithAI(imageUrl);
        
        // Cleanup dopo analisi riuscita
        try {
          await cleanupTempImage(imageUrl);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp image:', cleanupError);
        }
        
        return analysis;
      } catch (error) {
        console.warn(`Analysis attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) throw error;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
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
      let imageUrls: string[] = [];
      
      if (selectedImages.length > 0) {
        // Carica tutte le immagini
        for (const image of selectedImages) {
          const imageUrl = await uploadImage(image);
          imageUrls.push(imageUrl);
        }
      }

      const recipeData = {
        ...newRecipe,
        user_id: user.id,
        image_url: imageUrls[0] || newRecipe.image_url || null
      };

      // Per ora salviamo solo l'immagine principale
      // Il supporto completo per multiple immagini sarà disponibile dopo la migrazione del database
      console.log('Immagini caricate:', imageUrls);

      if (isEditing && selectedRecipe) {
        // Modifica ricetta esistente
        const { data, error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', selectedRecipe.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating recipe:', error);
          toast({
            title: 'Errore',
            description: 'Impossibile aggiornare la ricetta',
            variant: 'destructive'
          });
        } else {
          setRecipes(recipes.map(r => r.id === selectedRecipe.id ? data : r));
          setShowAddDialog(false);
          resetForm();
          setIsEditing(false);
          setSelectedRecipe(null);
          toast({
            title: 'Successo',
            description: 'Ricetta aggiornata con successo'
          });
        }
      } else {
        // Aggiungi nuova ricetta
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

  const confirmDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setShowDeleteDialog(true);
  };

  const deleteRecipe = async () => {
    if (!recipeToDelete) return;
    
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeToDelete.id);

      if (error) {
        console.error('Error deleting recipe:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile eliminare la ricetta',
          variant: 'destructive'
        });
      } else {
        setRecipes(recipes.filter(recipe => recipe.id !== recipeToDelete.id));
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
    } finally {
      setShowDeleteDialog(false);
      setRecipeToDelete(null);
    }
  };

  const resetForm = () => {
    setNewRecipe({
      title: '',
      description: '',
      category: 'main',
      tags: [],
      has_recipe_text: false
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setAnalyzingImageIndex(-1);
    setIsEditing(false);
    setSelectedRecipe(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

    const handleAnalyzeImage = async () => {
    if (selectedImages.length === 0) return;

    setAnalyzingImage(true);
    try {
      let combinedAnalysis: Partial<Recipe> = {};
      let hasIngredients = false;
      let hasInstructions = false;
      let baseDescription = '';

      // Analizza tutte le immagini in parallelo per velocizzare
      const analysisPromises = selectedImages.map(async (image, index) => {
        setAnalyzingImageIndex(index);
        
        try {
          // Usa retry logic per maggiore robustezza
          const analysis = await retryAnalysis(image, 2);
          
          // Aggiorna il progresso
          setAnalysisProgress(((index + 1) / selectedImages.length) * 100);
          
          return { analysis, index };
        } catch (error) {
          console.error(`Error analyzing image ${index + 1}:`, error);
          return { analysis: null, index };
        }
      });

      // Aspetta che tutte le analisi siano completate
      const results = await Promise.all(analysisPromises);

      // Processa i risultati
      results.forEach(({ analysis }) => {
        if (!analysis) return;

        // Combina le informazioni dalle diverse immagini
        if (analysis.title && !combinedAnalysis.title) {
          combinedAnalysis.title = analysis.title;
        }
        
        if (analysis.description) {
          const desc = analysis.description.toLowerCase();
          
          // Estrai la descrizione base (prima di ingredienti/istruzioni)
          if (!baseDescription && !desc.includes('ingredienti') && !desc.includes('istruzioni')) {
            baseDescription = analysis.description;
          }
          
          // Se contiene sia descrizione che ingredienti/istruzioni, estrai la parte descrittiva
          if (desc.includes('ingredienti') || desc.includes('istruzioni')) {
            const beforeIngredients = analysis.description.split(/ingredienti|istruzioni/i)[0];
            if (beforeIngredients && beforeIngredients.trim() && !baseDescription) {
              baseDescription = beforeIngredients.trim();
            }
          }
          
          // Estrai ingredienti
          if (desc.includes('ingredienti') && !hasIngredients) {
            const ingredientsMatch = analysis.description.match(/ingredienti[:\s]*(.*?)(?=istruzioni|$)/is);
            if (ingredientsMatch) {
              if (!combinedAnalysis.description) {
                combinedAnalysis.description = baseDescription || '';
              }
              combinedAnalysis.description += '\n\nINGREDIENTI:\n' + ingredientsMatch[1].trim();
              hasIngredients = true;
            }
          }
          
          // Estrai istruzioni
          if (desc.includes('istruzioni') && !hasInstructions) {
            const instructionsMatch = analysis.description.match(/istruzioni[:\s]*(.*?)$/is);
            if (instructionsMatch) {
              if (!combinedAnalysis.description) {
                combinedAnalysis.description = baseDescription || '';
              }
              combinedAnalysis.description += '\n\nISTRUZIONI:\n' + instructionsMatch[1].trim();
              hasInstructions = true;
            }
          }
          
          // Se non abbiamo ancora una descrizione, usa questa
          if (!combinedAnalysis.description) {
            combinedAnalysis.description = analysis.description;
          }
        }
        
        if (analysis.category && !combinedAnalysis.category) {
          combinedAnalysis.category = analysis.category;
        }
        
        if (analysis.tags) {
          if (combinedAnalysis.tags) {
            // Unisci i tag senza duplicati
            const existingTags = new Set(combinedAnalysis.tags);
            analysis.tags.forEach((tag: string) => existingTags.add(tag));
            combinedAnalysis.tags = Array.from(existingTags);
          } else {
            combinedAnalysis.tags = analysis.tags;
          }
        }
      });
      
      // Assicurati che la descrizione base sia sempre inclusa
      if (baseDescription && !combinedAnalysis.description?.includes(baseDescription)) {
        if (combinedAnalysis.description) {
          combinedAnalysis.description = baseDescription + '\n\n' + combinedAnalysis.description;
        } else {
          combinedAnalysis.description = baseDescription;
        }
      }
      
      setNewRecipe(prev => ({
        ...prev,
        ...combinedAnalysis
      }));
      
      toast({
        title: 'Analisi completata',
        description: `Analizzate ${results.length} immagini in parallelo. Informazioni combinate automaticamente.`
      });
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile analizzare le immagini',
        variant: 'destructive'
      });
    } finally {
      setAnalyzingImage(false);
      setAnalyzingImageIndex(-1);
      setAnalysisProgress(0);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowViewDialog(true);
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

  // Componente per visualizzare una ricetta
  const RecipeView = ({ recipe }: { recipe: Recipe }) => (
    <div className="space-y-6">
      {/* Immagini */}
      {(recipe.images && recipe.images.length > 0) || recipe.image_url ? (
        <div className="relative">
          {recipe.images && recipe.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {recipe.images.map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`${recipe.title} - ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          ) : (
            <img 
              src={recipe.image_url} 
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {getCategoryLabel(recipe.category)}
            </Badge>
          </div>
        </div>
      ) : null}

      {/* Titolo e descrizione */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{recipe.title}</h2>
        <div className="text-gray-300 mb-4 whitespace-pre-line">
          {recipe.description.split('\n').map((line, index) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-white">{line.replace(/\*\*/g, '')}</h3>;
            }
            return <p key={index} className="mb-1">{line}</p>;
          })}
        </div>
      </div>

      {/* Tag */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Tag</h3>
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-green-400 border-green-400">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}



      {/* Link esterno */}
      {recipe.external_link && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Link esterno</h3>
          <a 
            href={recipe.external_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Apri ricetta originale
          </a>
        </div>
      )}

      {/* Data creazione */}
      <div className="text-sm text-gray-500">
        Creata il: {new Date(recipe.created_at).toLocaleDateString('it-IT')}
      </div>
    </div>
  );

  // Funzioni per l'analisi del frigo
  const handleFridgeAnalysisComplete = async (result: any) => {
    setFridgeData(result);
    setShowFridgeAnalyzer(false);
    
    try {
      const matches = await findMatchingRecipes(result, recipes);
      setMatchingRecipes(matches);
      
      if (matches.length > 0) {
        setShowMatchingRecipes(true);
        toast({
          title: 'Successo',
          description: `Trovate ${matches.length} ricette compatibili!`
        });
      } else {
        setShowRecipeGenerator(true);
        toast({
          title: 'Info',
          description: 'Nessuna ricetta compatibile trovata. Generiamo nuove ricette!'
        });
      }
    } catch (error) {
      console.error('Errore nel matching delle ricette:', error);
      toast({
        title: 'Errore',
        description: 'Errore nella ricerca delle ricette compatibili',
        variant: 'destructive'
      });
    }
  };

  const handleRecipeGeneratorClose = () => {
    setShowRecipeGenerator(false);
    setFridgeData(null);
  };

  const handleSaveGeneratedRecipe = async (generatedRecipe: any) => {
    if (!user || !supabase) return;

    try {
      const recipeData = {
        title: generatedRecipe.title,
        description: `${generatedRecipe.description}\n\n**INGREDIENTI:**\n${generatedRecipe.ingredients.map((ing: string) => `• ${ing}`).join('\n')}\n\n**ISTRUZIONI:**\n${generatedRecipe.instructions.map((inst: string, index: number) => `${index + 1}. ${inst}`).join('\n')}`,
        category: generatedRecipe.category,
        tags: generatedRecipe.tags,
        ingredients: generatedRecipe.ingredients,
        user_id: user.id,
        has_recipe_text: true
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single();

      if (error) {
        console.error('Error saving generated recipe:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile salvare la ricetta generata',
          variant: 'destructive'
        });
      } else {
        setRecipes([data, ...recipes]);
        toast({
          title: 'Successo',
          description: 'Ricetta generata salvata con successo!'
        });
      }
    } catch (error) {
      console.error('Error saving generated recipe:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare la ricetta generata',
        variant: 'destructive'
      });
    }
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
          <div className="flex gap-3">
            <Button
              onClick={() => setShowFridgeAnalyzer(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Analizza Frigo
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Ricetta
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Modifica Ricetta' : 'Nuova Ricetta'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Modifica i dettagli della ricetta' : 'Aggiungi una nuova ricetta. Puoi caricare una foto per analisi automatica.'}
                </DialogDescription>
              </DialogHeader>
              
              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {imagePreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={preview} 
                              alt={`Preview ${index + 1}`} 
                              className={`w-full h-32 object-cover rounded-lg ${
                                analyzingImageIndex === index ? 'ring-2 ring-blue-500' : ''
                              }`}
                            />
                            {analyzingImageIndex === index && (
                              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                  Analizzando...
                                </div>
                              </div>
                            )}
                            <Button
                              onClick={() => {
                                setSelectedImages(prev => prev.filter((_, i) => i !== index));
                                setImagePreviews(prev => prev.filter((_, i) => i !== index));
                              }}
                              variant="ghost"
                              size="sm"
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Aggiungi Foto
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
                          {analyzingImage ? `Analizzando... ${Math.round(analysisProgress)}%` : 'Analizza con AI'}
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
                    {uploadingImage ? 'Salvando...' : (isEditing ? 'Aggiorna Ricetta' : 'Salva Ricetta')}
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
                            {recipe.description.split('\n').slice(0, 2).join('\n')}
                            {recipe.description.split('\n').length > 2 && '...'}
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
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleViewRecipe(recipe)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => confirmDelete(recipe)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(recipe.images && recipe.images.length > 0) || recipe.image_url ? (
                        <div className="mb-4">
                          {recipe.images && recipe.images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1 relative">
                              {recipe.images.slice(0, 4).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`${recipe.title} - ${index + 1}`}
                                  className="w-full h-16 object-cover rounded-lg"
                                />
                              ))}
                              {recipe.images.length > 4 && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                  +{recipe.images.length - 4}
                                </div>
                              )}
                            </div>
                          ) : (
                            <img
                              src={recipe.image_url}
                              alt={recipe.title}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      ) : null}
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

        {/* Dialog per visualizzare ricetta */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl">Dettagli Ricetta</DialogTitle>
            </DialogHeader>
            {selectedRecipe && <RecipeView recipe={selectedRecipe} />}
            <div className="flex justify-between pt-4">
              <Button
                onClick={() => {
                  if (selectedRecipe) {
                    setNewRecipe(selectedRecipe);
                    setIsEditing(true);
                    setShowViewDialog(false);
                    setShowAddDialog(true);
                    // Imposta la preview delle immagini esistenti
                    if (selectedRecipe.images && selectedRecipe.images.length > 0) {
                      setImagePreviews(selectedRecipe.images);
                    } else if (selectedRecipe.image_url) {
                      setImagePreviews([selectedRecipe.image_url]);
                    }
                  }
                }}
                className="bg-gradient-to-r from-green-400 to-blue-400 text-black hover:opacity-90"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifica Ricetta
              </Button>
              <Button
                onClick={() => setShowViewDialog(false)}
                variant="outline"
              >
                Chiudi
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog di conferma cancellazione */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">Conferma Cancellazione</DialogTitle>
              <DialogDescription className="text-gray-300">
                Sei sicuro di voler eliminare la ricetta "{recipeToDelete?.title}"? Questa azione non può essere annullata.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowDeleteDialog(false)}
                variant="outline"
              >
                Annulla
              </Button>
              <Button
                onClick={deleteRecipe}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Componenti per l'analisi del frigo */}
        {showFridgeAnalyzer && (
          <FridgeAnalyzer
            onAnalysisComplete={handleFridgeAnalysisComplete}
            onClose={() => setShowFridgeAnalyzer(false)}
          />
        )}

        {showRecipeGenerator && fridgeData && (
          <RecipeGenerator
            fridgeData={fridgeData}
            onClose={handleRecipeGeneratorClose}
            onSaveRecipe={handleSaveGeneratedRecipe}
          />
        )}

        {showMatchingRecipes && matchingRecipes.length > 0 && (
          <Dialog open={showMatchingRecipes} onOpenChange={setShowMatchingRecipes}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-500" />
                  Ricette Compatibili con il Tuo Frigo
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  Trovate {matchingRecipes.length} ricette che puoi preparare con i tuoi ingredienti
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{matchingRecipes.length}</div>
                    <div className="text-sm text-gray-400">Ricette compatibili</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{fridgeData.totalItems}</div>
                    <div className="text-sm text-gray-400">Ingredienti nel frigo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {Math.round(matchingRecipes.reduce((sum, match) => sum + match.coveragePercentage, 0) / matchingRecipes.length)}%
                    </div>
                    <div className="text-sm text-gray-400">Compatibilità media</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {matchingRecipes.slice(0, 6).map((match, index) => (
                    <Card key={index} className="bg-gray-800/50 border-gray-600 hover:border-green-500/50 transition-colors">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-white text-lg">{match.recipe.title}</CardTitle>
                          <Badge className={`${
                            match.coveragePercentage >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            match.coveragePercentage >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          }`}>
                            {Math.round(match.coveragePercentage)}% compatibile
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{match.recipe.description.split('\n')[0]}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium text-white mb-2">Ingredienti disponibili ({match.matchedIngredients.length}):</h4>
                          <div className="flex flex-wrap gap-1">
                            {match.matchedIngredients.slice(0, 3).map((ingredient: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                {ingredient}
                              </Badge>
                            ))}
                            {match.matchedIngredients.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{match.matchedIngredients.length - 3} altri
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {match.missingIngredients.length > 0 && (
                          <div>
                            <h4 className="font-medium text-white mb-2">Ingredienti mancanti ({match.missingIngredients.length}):</h4>
                            <div className="flex flex-wrap gap-1">
                              {match.missingIngredients.slice(0, 3).map((ingredient: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                                  {ingredient}
                                </Badge>
                              ))}
                              {match.missingIngredients.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{match.missingIngredients.length - 3} altri
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedRecipe(match.recipe);
                              setShowMatchingRecipes(false);
                              setShowViewDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizza
                          </Button>
                          <Button
                            onClick={() => {
                              toast({
                                title: 'Perfetto!',
                                description: 'Hai tutti gli ingredienti principali per questa ricetta!'
                              });
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Posso Fare
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowMatchingRecipes(false);
                      setShowRecipeGenerator(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Genera Nuove Ricette
                  </Button>
                  <Button
                    onClick={() => setShowMatchingRecipes(false)}
                    variant="outline"
                  >
                    Chiudi
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
