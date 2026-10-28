package com.mx.catalogservice.service;

import com.mx.catalogservice.entity.Category;
import com.mx.catalogservice.entity.Products;
import com.mx.catalogservice.event.OrderItemStockDto;
import com.mx.catalogservice.model.ProductRequest;
import com.mx.catalogservice.model.ProductResponse;
import com.mx.catalogservice.repository.CategoryDao;
import com.mx.catalogservice.repository.ProductsDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias de Products Service")
class ProductsImplTest {

    @Mock
    private ProductsDao productsDao;

    @Mock
    private CategoryDao categoryDao;

    @InjectMocks
    private ProductsImpl productsImpl;

    private Category category;
    private Products product;
    private ProductRequest productRequest;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(1L);
        category.setName("Tecnología");
        category.setActive(true);

        product = new Products();
        product.setId(10L);
        product.setSku("TECH-LAP-001");
        product.setName("Laptop Lenovo ThinkPad T14");
        product.setDescription("Laptop empresarial");
        product.setPrice(new BigDecimal("18999.99"));
        product.setStock(15);
        product.setImageUrl("https://example.com/laptop.jpg");
        product.setActive(true);
        product.setCategory(category);

        productRequest = new ProductRequest();
        productRequest.setSku("TECH-LAP-001");
        productRequest.setName("Laptop Lenovo ThinkPad T14");
        productRequest.setDescription("Laptop empresarial");
        productRequest.setPrice(new BigDecimal("18999.99"));
        productRequest.setStock(15);
        productRequest.setImageUrl("https://example.com/laptop.jpg");
        productRequest.setCategoryId(1L);
    }

    @Test
    @DisplayName("Crear producto exitoso: valida categoria, guarda y mapea response")
    void createProduct_Exitosa() {
        when(productsDao.existsBySku("TECH-LAP-001")).thenReturn(false);
        when(categoryDao.findById(1L)).thenReturn(Optional.of(category));
        when(productsDao.save(any(Products.class))).thenReturn(product);

        ProductResponse response = productsImpl.createProduct(productRequest);

        assertNotNull(response);
        assertEquals("TECH-LAP-001", response.getSku());
        assertEquals("Laptop Lenovo ThinkPad T14", response.getName());
        assertEquals("Tecnología", response.getCategoryName());
        verify(productsDao, times(1)).save(any(Products.class));
    }

    @Test
    @DisplayName("Crear producto con SKU duplicado: lanza IllegalArgumentException")
    void createProduct_SkuDuplicado_LanzaExcepcion() {
        when(productsDao.existsBySku("TECH-LAP-001")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            productsImpl.createProduct(productRequest);
        });

        assertTrue(ex.getMessage().contains("Ya existe un producto con el sku"));
        verify(productsDao, never()).save(any(Products.class));
    }

    @Test
    @DisplayName("Crear producto con categoría inexistente: lanza IllegalArgumentException")
    void createProduct_CategoriaNoExiste_LanzaExcepcion() {
        when(productsDao.existsBySku("TECH-LAP-001")).thenReturn(false);
        when(categoryDao.findById(1L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            productsImpl.createProduct(productRequest);
        });

        assertTrue(ex.getMessage().contains("No existe la categoria con id"));
        verify(productsDao, never()).save(any(Products.class));
    }

    @Test
    @DisplayName("Desactivar producto (Soft Delete): cambia active a false")
    void deactivateProduct_Exitosa() {
        when(productsDao.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(product));

        productsImpl.deactivateProduct(10L);

        assertFalse(product.getActive());
        verify(productsDao, times(1)).save(product);
    }

    @Test
    @DisplayName("Descontar stock de producto: reduce el inventario correctamente")
    void descontarStock_Exitosa() {
        when(productsDao.findById(10L)).thenReturn(Optional.of(product));

        OrderItemStockDto item = new OrderItemStockDto(10L, 5);
        productsImpl.descontarStock(List.of(item));

        assertEquals(10, product.getStock()); // 15 - 5 = 10
        verify(productsDao, times(1)).save(product);
    }

    @Test
    @DisplayName("Reintegrar stock de producto (por cancelación): incrementa inventario")
    void reintegrarStock_Exitosa() {
        when(productsDao.findById(10L)).thenReturn(Optional.of(product));

        OrderItemStockDto item = new OrderItemStockDto(10L, 3);
        productsImpl.reintegrarStock(List.of(item));

        assertEquals(18, product.getStock()); // 15 + 3 = 18
        verify(productsDao, times(1)).save(product);
    }
}
