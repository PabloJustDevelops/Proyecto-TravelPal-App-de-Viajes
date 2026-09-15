import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Task } from '@/lib/insforge';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { fieldClassName, textareaClassName } from '@/components/ui/fieldStyles';
import Button from '@/components/ui/Button';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
  initialData?: Task | null;
  isLoading?: boolean;
}

type FormData = {
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string;
};

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      status: 'pending',
      priority: 'medium'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('title', initialData.title);
        setValue('description', initialData.description || '');
        setValue('status', initialData.status);
        setValue('priority', initialData.priority);
        setValue('due_date', initialData.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : '');
      } else {
        reset({
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          due_date: ''
        });
      }
    }
  }, [isOpen, initialData, setValue, reset]);

  const onSubmit = (data: FormData) => {
    onSave({
      ...data,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined
    });
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {initialData ? 'Editar Tarea' : 'Nueva Tarea'}
                  </Dialog.Title>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="p-2"
                    aria-label="Cerrar"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Título
                    </label>
                    <input
                      type="text"
                      {...register('title', {
                        required: 'El título es obligatorio'
                      })}
                      className={fieldClassName}
                      placeholder="Ej: Revisar presupuesto"
                      aria-invalid={errors.title ? 'true' : 'false'}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className={textareaClassName}
                      placeholder="Detalles adicionales..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Estado
                      </label>
                      <select
                        {...register('status')}
                        className={fieldClassName}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Prioridad
                      </label>
                      <select
                        {...register('priority')}
                        className={fieldClassName}
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha Límite
                    </label>
                    <input
                      type="date"
                      {...register('due_date')}
                      className={fieldClassName}
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      loading={isLoading}
                    >
                      Guardar
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
