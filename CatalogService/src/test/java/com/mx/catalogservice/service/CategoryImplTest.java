package com.mx.catalogservice.service;

import com.mx.catalogservice.entity.Category;
import com.mx.catalogservice.model.CategoryRequest;
import com.mx.catalogservice.model.CategoryResponse;
import com.mx.catalogservice.repository.CategoryDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias de Category Service")
class CategoryImplTest {

    @Mock
    private CategoryDao categoryDao;

    @InjectMocks
    private CategoryImpl categoryImpl;

    private CategoryRequest categoryRequest;
    private Category categoryEntity;

    @BeforeEach
    void setUp() {
        categoryRequest = new CategoryRequest();
        categoryRequest.setName("Tecnología");

        categoryEntity = new Category();
        categoryEntity.setId(1L);
        categoryEntity.setName("Tecnología");
        categoryEntity.setActive(true);
    }

    @Test
    @DisplayName("Crear categoría exitosa: guarda y devuelve CategoryResponse")
    void createCategory_Exitosa() {
        when(categoryDao.existsByName("Tecnología")).thenReturn(false);
        when(categoryDao.save(any(Category.class))).thenReturn(categoryEntity);

        CategoryResponse response = categoryImpl.createCategory(categoryRequest);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Tecnología", response.getName());
        verify(categoryDao, times(1)).save(any(Category.class));
    }

    @Test
    @DisplayName("Crear categoría con nombre duplicado: lanza IllegalArgumentException")
    void createCategory_NombreDuplicado_LanzaExcepcion() {
        when(categoryDao.existsByName("Tecnología")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            categoryImpl.createCategory(categoryRequest);
        });

        assertTrue(ex.getMessage().contains("Ya existe una categoria"));
        verify(categoryDao, never()).save(any(Category.class));
    }

    @Test
    @DisplayName("Listar categorías activas: devuelve solo las activas mapeadas a DTO")
    void listActiveCategories_Exitosa() {
        when(categoryDao.findByActiveTrue()).thenReturn(List.of(categoryEntity));

        List<CategoryResponse> list = categoryImpl.listActiveCategories();

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Tecnología", list.get(0).getName());
    }

    @Test
    @DisplayName("Actualizar categoría exitosa: modifica el nombre y persiste")
    void updateCategory_Exitosa() {
        when(categoryDao.findById(1L)).thenReturn(Optional.of(categoryEntity));
        when(categoryDao.save(any(Category.class))).thenReturn(categoryEntity);

        CategoryRequest updateRequest = new CategoryRequest();
        updateRequest.setName("Electrónica");

        when(categoryDao.existsByName("Electrónica")).thenReturn(false);

        CategoryResponse response = categoryImpl.updateCategory(1L, updateRequest);

        assertNotNull(response);
        verify(categoryDao, times(1)).save(categoryEntity);
    }

    @Test
    @DisplayName("Desactivar categoría (Soft Delete): cambia active a false")
    void deactivateCategory_Exitosa() {
        when(categoryDao.findById(1L)).thenReturn(Optional.of(categoryEntity));

        categoryImpl.deactivateCategory(1L);

        assertFalse(categoryEntity.getActive());
        verify(categoryDao, times(1)).save(categoryEntity);
    }
}
