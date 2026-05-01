import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { FormError } from './form-error'
import {
  EmailField,
  NumberField,
  PasswordField,
  PhoneField,
  SelectField,
  TextareaField,
  TextField,
} from './form-fields'
import { SubmitButton } from './form-submit'

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    EmailField,
    PasswordField,
    TextareaField,
    SelectField,
    NumberField,
    PhoneField,
  },
  formComponents: {
    SubmitButton,
    FormError,
  },
  fieldContext,
  formContext,
})
